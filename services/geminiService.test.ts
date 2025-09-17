import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateTerraformCode, createPrompt } from './geminiService';
import type { GcpConfig, GeneratedFiles } from '../types';

// Mock the GoogleGenAI class from the @google/genai module
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', async (importOriginal) => {
  // FIX: Changed generic type argument to a type assertion to fix "Untyped function calls may not accept type arguments" error.
  const actual = await importOriginal() as typeof import('@google/genai');
  return {
    ...actual, // Keep original exports like 'Type' enum
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
  };
});

// We need the real Type enum for the test assertion
const { Type } = await import('@google/genai');

const MOCK_CONFIG: GcpConfig = {
    projectId: 'test-project',
    region: 'us-central1',
    bucketName: 'test-bucket',
    vpc: { enabled: true, name: 'test-vpc', subnets: [] },
    gke: { enabled: false, name: 'test-cluster', network: '', subnetwork: '', nodePools: [] },
    compute: { enabled: true, name: 'test-vm', machineType: 'e2-micro', zone: 'us-central1-a', image: 'debian-11' },
    cloudsql: { enabled: false, name: 'test-db', databaseVersion: 'POSTGRES_14', tier: 'db-g1-small', highAvailability: false, backupConfiguration: { enabled: false, startTime: '' } },
    firewall: { enabled: true, rules: [] },
    gsm: { enabled: false, secrets: [] },
    iam: { enabled: false, serviceAccountName: 'test-sa', projectRoles: [] },
    cloudRun: { enabled: false, name: 'test-cr', location: 'us-central1', image: '', cpu: '1', memory: '512Mi', minInstances: 0, maxInstances: 1, allowUnauthenticated: false },
    cloudStorage: { enabled: false, buckets: [] },
};


describe('geminiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.GCP_GENERATOR_API_KEY = "test-api-key";
    });

    describe('createPrompt', () => {
        it('should create a prompt with only enabled modules', () => {
            const prompt = createPrompt(MOCK_CONFIG);
            // Robustly extract the JSON after the 'Configuration:' label
            const cfgIndex = prompt.indexOf('Configuration:');
            expect(cfgIndex).toBeGreaterThan(-1);
            const afterCfg = prompt.slice(cfgIndex);
            const start = afterCfg.indexOf('{');
            const end = afterCfg.lastIndexOf('}');
            const configString = afterCfg.substring(start, end + 1);
            const promptConfig = JSON.parse(configString);

            expect(prompt).toContain('You are an expert Google Cloud Platform engineer');
            expect(promptConfig).toHaveProperty('vpc');
            expect(promptConfig).toHaveProperty('compute');
            expect(promptConfig).toHaveProperty('firewall');
            expect(promptConfig).not.toHaveProperty('gke');
            expect(promptConfig).not.toHaveProperty('cloudsql');
            expect(promptConfig.vpc.name).toBe('test-vpc');
        });

        it('should include all modules in the prompt if they are all enabled', () => {
            const ALL_ENABLED_CONFIG: GcpConfig = {
                projectId: 'all-on',
                region: 'us-east1',
                bucketName: 'all-on-bucket',
                vpc: { enabled: true, name: 'vpc', subnets: [] },
                gke: { enabled: true, name: 'gke', network: 'vpc', subnetwork: 'sub', nodePools: [] },
                compute: { enabled: true, name: 'compute', machineType: 'n1-standard-1', zone: 'us-east1-b', image: 'debian-11' },
                cloudsql: { enabled: true, name: 'sql', databaseVersion: 'POSTGRES_14', tier: 'db-g1-small', highAvailability: true, backupConfiguration: { enabled: true, startTime: '03:00' } },
                firewall: { enabled: true, rules: [] },
                gsm: { enabled: true, secrets: [{ id: 'secret' }] },
                iam: { enabled: true, serviceAccountName: 'iam-sa', projectRoles: ['roles/viewer'] },
                cloudRun: { enabled: true, name: 'cr-service', location: 'us-east1', image: 'gcr.io/hello', cpu: '1', memory: '256Mi', minInstances: 0, maxInstances: 1, allowUnauthenticated: true },
                cloudStorage: { enabled: true, buckets: [{ name: 'cs-bucket', location: 'US', storageClass: 'STANDARD', versioningEnabled: false }] },
            };
            const prompt = createPrompt(ALL_ENABLED_CONFIG);
            const cfgIndex = prompt.indexOf('Configuration:');
            expect(cfgIndex).toBeGreaterThan(-1);
            const afterCfg = prompt.slice(cfgIndex);
            const start = afterCfg.indexOf('{');
            const end = afterCfg.lastIndexOf('}');
            const configString = afterCfg.substring(start, end + 1);
            const promptConfig = JSON.parse(configString);

            expect(promptConfig).toHaveProperty('vpc');
            expect(promptConfig).toHaveProperty('gke');
            expect(promptConfig).toHaveProperty('compute');
            expect(promptConfig).toHaveProperty('cloudsql');
            expect(promptConfig).toHaveProperty('firewall');
            expect(promptConfig).toHaveProperty('gsm');
            expect(promptConfig).toHaveProperty('iam');
            expect(promptConfig).toHaveProperty('cloudRun');
            expect(promptConfig).toHaveProperty('cloudStorage');
        });

        it('should stringify the active config correctly', () => {
            const prompt = createPrompt(MOCK_CONFIG);
            const expectedActiveConfig = {
                projectId: 'test-project',
                region: 'us-central1',
                bucketName: 'test-bucket',
                vpc: MOCK_CONFIG.vpc,
                compute: MOCK_CONFIG.compute,
                firewall: MOCK_CONFIG.firewall,
            };
            expect(prompt).toContain(JSON.stringify(expectedActiveConfig, null, 2));
        });
    });

    describe('generateTerraformCode', () => {
        it('should throw an error if API key is not configured', async () => {
            window.GCP_GENERATOR_API_KEY = "";
            await expect(generateTerraformCode(MOCK_CONFIG)).rejects.toThrow('API_KEY is not configured. Please set the API_KEY environment variable for the container.');
            
            window.GCP_GENERATOR_API_KEY = "__API_KEY__";
            await expect(generateTerraformCode(MOCK_CONFIG)).rejects.toThrow('API_KEY is not configured. Please set the API_KEY environment variable for the container.');
        });
        
        it('should call Gemini API with the correct prompt and schema', async () => {
            mockGenerateContent.mockResolvedValue({ text: '{}' });

            await generateTerraformCode(MOCK_CONFIG);

            const { GoogleGenAI } = await import('@google/genai');
            expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
            expect(mockGenerateContent).toHaveBeenCalledTimes(1);

            const callArgs = mockGenerateContent.mock.calls[0][0];
            expect(callArgs.model).toBe('gemini-2.5-flash');
            expect(callArgs.contents).toContain('"projectId": "test-project"');
            expect(callArgs.config.responseMimeType).toBe("application/json");
            expect(callArgs.config.responseSchema).toEqual({
                type: Type.OBJECT,
                properties: {
                    main_tf: { type: Type.STRING, description: expect.any(String) },
                    variables_tf: { type: Type.STRING, description: expect.any(String) },
                    outputs_tf: { type: Type.STRING, description: expect.any(String) },
                    readme_md: { type: Type.STRING, description: expect.any(String) },
                    setup_sh: { type: Type.STRING, description: expect.any(String) },
                },
            });
        });

        it('should parse the JSON response and return files', async () => {
            const mockResponse: Partial<GeneratedFiles> = {
                main_tf: 'resource "google_vpc" "main" {}',
                variables_tf: 'variable "project_id" {}',
            };
            mockGenerateContent.mockResolvedValue({ text: `\`\`\`json\n${JSON.stringify(mockResponse)}\n\`\`\`` });

            const result = await generateTerraformCode(MOCK_CONFIG);

            expect(result.main_tf).toBe('resource "google_vpc" "main" {}');
            expect(result.variables_tf).toBe('variable "project_id" {}');
            expect(result.outputs_tf).toBe(''); // Should handle missing keys gracefully
            expect(result.license).toContain('MIT License');
        });
        
        it('should correctly parse a plain, unwrapped JSON response', async () => {
            const mockResponse = { main_tf: 'resource {}', variables_tf: 'variable {}' };
            mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockResponse) });

            const result = await generateTerraformCode(MOCK_CONFIG);
            expect(result.main_tf).toBe('resource {}');
            expect(result.variables_tf).toBe('variable {}');
        });

        it('should throw a specific error for malformed JSON responses', async () => {
            // Use a malformed JSON string that will cause JSON.parse to fail
            const malformedJson = '{"main_tf": "resource {}"';
            mockGenerateContent.mockResolvedValue({ text: malformedJson });
        
            // We expect the promise to be rejected, and the error message should indicate failure.
            // JSON.parse error messages can vary, so we check for the part we control.
            await expect(generateTerraformCode(MOCK_CONFIG)).rejects.toThrow(/Failed to generate Terraform code/);
          });

        it('should handle API errors gracefully', async () => {
            const apiError = new Error('API request failed');
            mockGenerateContent.mockRejectedValue(apiError);

            await expect(generateTerraformCode(MOCK_CONFIG)).rejects.toThrow('Failed to generate Terraform code. Details: API request failed');
        });
        
        it('should include Gemini response text in error on failure', async () => {
            const apiError: any = new Error('API request failed');
            apiError.response = { text: 'Blocked for safety reasons.' };
            mockGenerateContent.mockRejectedValue(apiError);

            await expect(generateTerraformCode(MOCK_CONFIG)).rejects.toThrow('Failed to generate Terraform code. Details: API request failed | Gemini Response: Blocked for safety reasons.');
        });

        it('should handle non-Error API rejections', async () => {
            const stringError = 'A simple string error';
            mockGenerateContent.mockRejectedValue(stringError);
        
            await expect(generateTerraformCode(MOCK_CONFIG)).rejects.toThrow(`Failed to generate Terraform code. Details: ${stringError}`);
        });
    });
});