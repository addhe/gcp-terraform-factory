// FIX: Import the 'Type' enum to define the response schema for the Gemini API call.
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { GcpConfig, GeneratedFiles } from '../types';

// Memberi tahu TypeScript tentang variabel global yang kita definisikan di index.html
declare global {
  interface Window {
    GCP_GENERATOR_API_KEY: string;
  }
}

const MIT_LICENSE = `MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to a particular "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

export const createPrompt = (config: GcpConfig): string => {
  // Filter out disabled modules from the config to simplify the prompt
  const activeConfig: Partial<GcpConfig> & { projectId: string; region: string; bucketName: string } = {
    projectId: config.projectId,
    region: config.region,
    bucketName: config.bucketName
  };
  
  if (config.vpc.enabled) activeConfig.vpc = config.vpc;
  if (config.gke.enabled) activeConfig.gke = config.gke;
  if (config.compute.enabled) activeConfig.compute = config.compute;
  if (config.cloudsql.enabled) activeConfig.cloudsql = config.cloudsql;
  if (config.firewall.enabled) activeConfig.firewall = config.firewall;
  if (config.gsm.enabled) activeConfig.gsm = config.gsm;
  if (config.iam.enabled) activeConfig.iam = config.iam;
  if (config.cloudRun.enabled) activeConfig.cloudRun = config.cloudRun;
  if (config.cloudStorage.enabled) activeConfig.cloudStorage = config.cloudStorage;


  return `
    You are an expert Google Cloud Platform engineer and a Terraform specialist.
    Based on the following JSON configuration, generate a complete and coherent set of Terraform files to deploy the specified infrastructure.
    The code should be well-structured, production-ready, and follow best practices.

    **Important Implementation Notes:**
    - For 'google_container_node_pool' resources, if a node pool object has '"autoscaling": true', you MUST generate an 'autoscaling' block within the resource containing 'min_node_count' and 'max_node_count' from the config. In this case, you MUST OMIT the 'initial_node_count' attribute. If '"autoscaling": false', you must set 'initial_node_count' to the 'nodeCount' value and MUST NOT include the 'autoscaling' block.
    - For the 'google_sql_database_instance' resource, if the configuration includes '"highAvailability": true', you MUST set the 'availability_type' to 'REGIONAL' in the settings block. If it is false or omitted, the default 'ZONAL' is acceptable.
    - For 'google_compute_firewall' resources, if a rule's 'allowed' block has a 'protocol' but is missing the 'ports' property, it means you should allow ALL ports for that protocol. In Terraform, this is achieved by simply not including the 'ports' attribute in the 'allowed' block.
    - If the 'compute' configuration contains a 'startupScript' property with a non-empty value, you MUST add a 'metadata_startup_script' attribute to the 'google_compute_instance' resource with the value of that property. If 'startupScript' is empty or not present, do not add this attribute.
    - If the 'iam' configuration is enabled, you MUST generate a 'google_service_account' resource named 'main' using the 'serviceAccountName' property for the 'account_id'. The 'display_name' should be a user-friendly version of the name. Then, for EACH role in the 'projectRoles' array, you MUST generate a SEPARATE 'google_project_iam_member' resource. The 'role' for this resource is the string from the array, and the 'member' attribute MUST be the interpolated identity of the created service account: "serviceAccount:\${google_service_account.main.email}". You must create a unique Terraform resource name for each 'google_project_iam_member' block by sanitizing the role string (e.g., 'roles/storage.admin' becomes 'project_storage_admin_binding').
    - If the 'cloudRun' configuration is enabled, you MUST generate a 'google_cloud_run_v2_service' resource. The service name and location should come from the config. Inside the 'template' block, define a 'containers' block with the specified 'image'. Inside this 'containers' block, create a 'resources' block with 'limits' for 'cpu' and 'memory' using the values from the config. The 'scaling' block should use 'min_instance_count' and 'max_instance_count' from the config. If 'allowUnauthenticated' is true, you MUST also generate a 'google_cloud_run_service_iam_member' resource for this service with 'role = "roles/run.invoker"' and 'member = "allUsers"'.
    - If the 'cloudStorage' configuration is enabled, for EACH bucket in the 'buckets' array, you MUST generate a SEPARATE 'google_storage_bucket' resource. Use the bucket's 'name', 'location', and 'storage_class' from the config. If 'versioningEnabled' is true for a bucket, you MUST include a 'versioning' block with 'enabled = true' inside the resource. The Terraform resource name for each bucket should be a sanitized version of the bucket name (e.g., 'my-app-bucket' becomes 'my_app_bucket').

    Configuration:
    ${JSON.stringify(activeConfig, null, 2)}

    Please generate the following files:
    1.  **main.tf**: Contains the main resource definitions (provider, backend, locals, and all resources based on the config).
    2.  **variables.tf**: Contains variable definitions for project_id, region, and any other customizable values.
    3.  **outputs.tf**: Contains outputs for important generated resources (e.g., GKE cluster endpoint, Compute instance IP).
    4.  **README.md**: A helpful getting-started guide explaining the infrastructure and how to use the Terraform code. It should reference the setup.sh script.
    5.  **setup.sh**: A bash script to create the GCS bucket for the Terraform backend state. It must use the bucket name from the configuration.

    The final output MUST be a single, valid JSON object with the following keys: "main_tf", "variables_tf", "outputs_tf", "readme_md", and "setup_sh".
    The value for each key must be a string containing the corresponding file content.
    Do not include any explanations, introductions, or code block markers (like \`\`\`) outside of the JSON object itself.
  `;
};

export const generateTerraformCode = async (config: GcpConfig): Promise<GeneratedFiles> => {
  const apiKey = window.GCP_GENERATOR_API_KEY;
  if (!apiKey || apiKey === "__API_KEY__") {
    throw new Error("API_KEY is not configured. Please set the API_KEY environment variable for the container.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = createPrompt(config);

  try {
    // FIX: Use responseSchema to ensure the model returns a valid JSON object
    // with the expected structure. This improves reliability and follows
    // best practices for getting structured data from the Gemini API.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            main_tf: { type: Type.STRING, description: "The content for the main.tf file." },
            variables_tf: { type: Type.STRING, description: "The content for the variables.tf file." },
            outputs_tf: { type: Type.STRING, description: "The content for the outputs.tf file." },
            readme_md: { type: Type.STRING, description: "The content for the README.md file." },
            setup_sh: { type: Type.STRING, description: "The content for the setup.sh file." },
          },
        },
      },
    });

    const rawJson = response.text.trim();
    
    // Sometimes the model might wrap the JSON in ```json ... ```, so we clean it.
    const cleanedJson = rawJson.replace(/^```json\s*|```\s*$/g, '');
    
    const parsedResponse = JSON.parse(cleanedJson);

    return {
      main_tf: parsedResponse.main_tf || '',
      variables_tf: parsedResponse.variables_tf || '',
      outputs_tf: parsedResponse.outputs_tf || '',
      readme_md: parsedResponse.readme_md || '',
      setup_sh: parsedResponse.setup_sh || '',
      license: MIT_LICENSE,
    };
  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    let errorMessage = "Failed to generate Terraform code. ";
    if (error instanceof Error) {
        errorMessage += `Details: ${error.message}`;
    } else {
        errorMessage += `Details: ${String(error)}`;
    }
    const responseText = (error as any)?.response?.text;
    if(responseText) {
        errorMessage += ` | Gemini Response: ${responseText}`;
    }
    throw new Error(errorMessage);
  }
};