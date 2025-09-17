import { createPrompt, generateTerraformCode } from '../services/geminiService';
import type { GcpConfig } from '../types';

(async () => {
  // Exercise createPrompt with two configs
  const cfg1: GcpConfig = {
    projectId: 'p', region: 'r', bucketName: 'b',
    vpc: { enabled: true, name: 'v', subnets: [] },
    gke: { enabled: false, name: '', network: '', subnetwork: '', nodePools: [] },
    compute: { enabled: true, name: 'c', machineType: 'm', zone: 'z', image: 'img' },
    cloudsql: { enabled: false, name: '', databaseVersion: 'POSTGRES_14', tier: '', highAvailability: false, backupConfiguration: { enabled: false, startTime: '' } },
    firewall: { enabled: false, rules: [] },
    gsm: { enabled: false, secrets: [] },
    iam: { enabled: false, serviceAccountName: '', projectRoles: [] },
    cloudRun: { enabled: false, name: '', location: '', image: '', cpu: '1', memory: '256Mi', minInstances: 0, maxInstances: 1, allowUnauthenticated: false },
    cloudStorage: { enabled: false, buckets: [] },
  };

  createPrompt(cfg1);

  // For generateTerraformCode we mock window.GCP_GENERATOR_API_KEY to cause early exit
  (globalThis as any).window = (globalThis as any).window || {};
  (globalThis as any).window.GCP_GENERATOR_API_KEY = '';
  try {
    await generateTerraformCode(cfg1);
  } catch (e) {
    // expected
  }

  console.log('Runner finished');
})();
