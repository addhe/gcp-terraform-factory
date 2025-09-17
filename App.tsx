import React, { useState, useCallback, useEffect } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { CodePanel } from './components/CodePanel';
import { GcpConfig, GeneratedFiles, FirewallRule } from './types';
import { generateTerraformCode } from './services/geminiService';
import { TerraformIcon, GithubIcon } from './components/icons';

const GKE_HEALTH_CHECK_RULE_NAME = 'allow-gke-health-checks';
// This rule is required by GKE for external load balancers and health checks.
const GKE_HEALTH_CHECK_RULE: FirewallRule = {
  name: GKE_HEALTH_CHECK_RULE_NAME,
  direction: 'INGRESS',
  priority: 1000,
  ranges: ['130.211.0.0/22', '35.191.0.0/16'],
  allowed: [{ protocol: 'tcp' }], // No ports property means all ports for the protocol
};


const App: React.FC = () => {
  const [config, setConfig] = useState<GcpConfig>({
    projectId: 'your-gcp-project-id',
    region: 'us-central1',
    bucketName: 'your-unique-terraform-state-bucket',
    vpc: {
      enabled: true,
      name: 'main-vpc',
      subnets: [{ name: 'web-subnet', cidr: '10.10.1.0/24', region: 'us-central1' }],
    },
    gke: {
      enabled: true,
      name: 'main-cluster',
      network: 'main-vpc',
      subnetwork: 'web-subnet',
      nodePools: [
        { name: 'default-pool', nodeCount: 1, machineType: 'e2-medium', diskSizeGb: 100, autoscaling: false, minNodeCount: 1, maxNodeCount: 3 },
      ],
    },
    compute: {
      enabled: false,
      name: 'web-server-instance',
      machineType: 'e2-micro',
      zone: 'us-central1-a',
      image: 'debian-cloud/debian-11',
      startupScript: '',
    },
    cloudsql: {
      enabled: false,
      name: 'main-db-instance',
      databaseVersion: 'POSTGRES_14',
      tier: 'db-g1-small',
      highAvailability: false,
      backupConfiguration: {
        enabled: true,
        startTime: '04:00',
      },
    },
    firewall: {
      enabled: true,
      rules: [
        { name: 'allow-ssh', direction: 'INGRESS', priority: 1000, ranges: ['0.0.0.0/0'], allowed: [{ protocol: 'tcp', ports: ['22'] }] },
        { name: 'allow-http-https', direction: 'INGRESS', priority: 1000, ranges: ['0.0.0.0/0'], allowed: [{ protocol: 'tcp', ports: ['80', '443'] }] },
      ],
    },
    gsm: {
      enabled: false,
      secrets: [{ id: 'app-database-password' }],
    },
    iam: {
      enabled: false,
      serviceAccountName: 'my-app-sa',
      projectRoles: [
        'roles/storage.objectViewer',
        'roles/logging.logWriter'
      ],
    },
    cloudRun: {
      enabled: false,
      name: 'my-cloud-run-service',
      location: 'us-central1',
      image: 'gcr.io/cloudrun/hello',
      cpu: '1',
      memory: '512Mi',
      minInstances: 0,
      maxInstances: 10,
      allowUnauthenticated: true,
    },
    cloudStorage: {
      enabled: false,
      buckets: [
        { name: 'my-unique-app-bucket-1', location: 'US', storageClass: 'STANDARD', versioningEnabled: true },
      ],
    },
  });

  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfig(currentConfig => {
        const rules = [...currentConfig.firewall.rules];
        const ruleIndex = rules.findIndex(rule => rule.name === GKE_HEALTH_CHECK_RULE_NAME);
        const shouldHaveRule = currentConfig.gke.enabled && currentConfig.firewall.enabled;

        if (shouldHaveRule && ruleIndex === -1) {
            rules.push(GKE_HEALTH_CHECK_RULE);
        } else if (!shouldHaveRule && ruleIndex !== -1) {
            rules.splice(ruleIndex, 1);
        } else {
            return currentConfig; // No change needed
        }

        return {
            ...currentConfig,
            firewall: {
                ...currentConfig.firewall,
                rules,
            },
        };
    });
  }, [config.gke.enabled, config.firewall.enabled]);

  const handleGenerateCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedFiles(null);
    try {
      const files = await generateTerraformCode(config);
      setGeneratedFiles(files);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while generating the code. Check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  return (
    <div className="min-h-screen font-sans">
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <TerraformIcon className="h-8 w-8 text-purple-400" />
          <div>
            <h1 className="text-xl font-bold text-white">GCP Terraform IaC Generator</h1>
            <p className="text-sm text-gray-400">Configure your infrastructure and generate production-ready Terraform code with AI.</p>
          </div>
        </div>
        <a href="https://github.com/google/generative-ai-docs" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
          <GithubIcon className="h-6 w-6" />
        </a>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-[calc(100vh-81px)]">
        <ConfigPanel
          config={config}
          setConfig={setConfig}
          onGenerate={handleGenerateCode}
          isLoading={isLoading}
        />
        <CodePanel
          files={generatedFiles}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
};

export default App;