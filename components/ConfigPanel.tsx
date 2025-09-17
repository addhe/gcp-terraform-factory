import React from 'react';
import type { GcpConfig } from '../types';
import { SparklesIcon } from './icons';
import { Section } from './common/Section';
import { Input } from './common/FormControls';
import { VpcConfig, GkeConfig, ComputeConfig, CloudSqlConfig, FirewallConfig, GsmConfig, IamConfig, CloudRunConfig, CloudStorageConfig } from './config/ModuleConfigs';
import { Subnet, GkeNodePool, FirewallRule, StorageBucket } from '../types';

interface ConfigPanelProps {
  config: GcpConfig;
  setConfig: React.Dispatch<React.SetStateAction<GcpConfig>>;
  onGenerate: () => void;
  isLoading: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig, onGenerate, isLoading }) => {

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSectionToggle = (section: keyof Omit<GcpConfig, 'projectId' | 'region' | 'bucketName'>, enabled: boolean) => {
    setConfig(prev => ({...prev, [section]: {...prev[section], enabled}}));
  };

  // VPC Handlers
  const handleVpcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({...prev, vpc: {...prev.vpc, [e.target.name]: e.target.value}}));
  };
  const handleSubnetChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubnets = [...config.vpc.subnets];
    newSubnets[index] = {...newSubnets[index], [e.target.name]: e.target.value};
    setConfig(prev => ({...prev, vpc: {...prev.vpc, subnets: newSubnets}}));
  };
  const addSubnet = () => {
    const newSubnet: Subnet = { name: `subnet-${config.vpc.subnets.length + 1}`, cidr: '10.10.2.0/24', region: config.region };
    setConfig(prev => ({...prev, vpc: {...prev.vpc, subnets: [...prev.vpc.subnets, newSubnet]}}));
  };
  const removeSubnet = (index: number) => {
    const newSubnets = config.vpc.subnets.filter((_, i) => i !== index);
    setConfig(prev => ({...prev, vpc: {...prev.vpc, subnets: newSubnets}}));
  };

  // GKE Handlers
  const handleGkeClusterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({...prev, gke: {...prev.gke, [e.target.name]: e.target.value}}));
  };
  const handleNodePoolChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newNodePools = [...config.gke.nodePools];
    const pool = { ...newNodePools[index] };
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
        (pool as any)[name] = checked;
    } else {
        const isNumber = ['nodeCount', 'diskSizeGb', 'minNodeCount', 'maxNodeCount'].includes(name);
        (pool as any)[name] = isNumber ? parseInt(value, 10) || 0 : value;
    }
    newNodePools[index] = pool;
    setConfig(prev => ({ ...prev, gke: { ...prev.gke, nodePools: newNodePools } }));
  };
  const addNodePool = () => {
    const newNodePool: GkeNodePool = { name: `pool-${config.gke.nodePools.length + 1}`, nodeCount: 1, machineType: 'e2-medium', diskSizeGb: 100, autoscaling: false, minNodeCount: 1, maxNodeCount: 3 };
    setConfig(prev => ({...prev, gke: {...prev.gke, nodePools: [...prev.gke.nodePools, newNodePool]}}));
  };
  const removeNodePool = (index: number) => {
    const newNodePools = config.gke.nodePools.filter((_, i) => i !== index);
    setConfig(prev => ({...prev, gke: {...prev.gke, nodePools: newNodePools}}));
  };

  // Compute Handlers
  const handleComputeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setConfig(prev => ({...prev, compute: {...prev.compute, [e.target.name]: e.target.value}}));
  };

  // CloudSQL Handlers
  const handleCloudSqlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({...prev, cloudsql: {...prev.cloudsql, [name]: type === 'checkbox' ? checked : value}}));
  };
  const handleCloudSqlBackupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
        ...prev,
        cloudsql: {
            ...prev.cloudsql,
            backupConfiguration: {
                ...prev.cloudsql.backupConfiguration,
                [name]: type === 'checkbox' ? checked : value
            }
        }
    }));
  };

  // Firewall Handlers
  const handleFirewallRuleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newRules = JSON.parse(JSON.stringify(config.firewall.rules));
    const rule = newRules[index];
    const { name, value } = e.target;
    if (name === 'ranges') {
        rule.ranges = value.split(',').map(s => s.trim()).filter(Boolean);
    } else if (name === 'priority') {
        rule.priority = parseInt(value, 10) || 1000;
    } else {
        (rule as any)[name] = value;
    }
    setConfig(prev => ({...prev, firewall: {...prev.firewall, rules: newRules}}));
  };
  const handleFirewallAllowedChange = (ruleIndex: number, allowedIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newRules = JSON.parse(JSON.stringify(config.firewall.rules));
    const allow = newRules[ruleIndex].allowed[allowedIndex];
    const { name, value } = e.target;
    if (name === 'protocol') {
        allow.protocol = value.toLowerCase();
    } else if (name === 'ports') {
        const ports = value.split(',').map(s => s.trim()).filter(Boolean);
        if (ports.length > 0) {
            allow.ports = ports;
        } else {
            delete allow.ports;
        }
    }
    setConfig(prev => ({...prev, firewall: {...prev.firewall, rules: newRules}}));
  };
  const addFirewallAllowed = (ruleIndex: number) => {
    const newRules = JSON.parse(JSON.stringify(config.firewall.rules));
    newRules[ruleIndex].allowed.push({ protocol: 'tcp', ports: ['8080'] });
    setConfig(prev => ({...prev, firewall: {...prev.firewall, rules: newRules}}));
  };
  const removeFirewallAllowed = (ruleIndex: number, allowedIndex: number) => {
    const newRules = JSON.parse(JSON.stringify(config.firewall.rules));
    if (newRules[ruleIndex].allowed.length > 1) {
        newRules[ruleIndex].allowed.splice(allowedIndex, 1);
        setConfig(prev => ({...prev, firewall: {...prev.firewall, rules: newRules}}));
    }
  };
  const addFirewallRule = () => {
    const newRule: FirewallRule = { name: `new-rule-${config.firewall.rules.length + 1}`, direction: 'INGRESS', priority: 1000, ranges: ['0.0.0.0/0'], allowed: [{ protocol: 'tcp', ports: ['8080'] }] };
    setConfig(prev => ({...prev, firewall: {...prev.firewall, rules: [...prev.firewall.rules, newRule]}}));
  };
  const removeFirewallRule = (index: number) => {
    const newRules = config.firewall.rules.filter((_, i) => i !== index);
    setConfig(prev => ({...prev, firewall: {...prev.firewall, rules: newRules}}));
  };

  // GSM Handlers
  const handleGsmChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newSecrets = [...config.gsm.secrets];
    newSecrets[index] = {...newSecrets[index], [e.target.name]: e.target.value};
    setConfig(prev => ({...prev, gsm: {...prev.gsm, secrets: newSecrets}}));
  };
  const addGsmSecret = () => {
    setConfig(prev => ({...prev, gsm: {...prev.gsm, secrets: [...prev.gsm.secrets, { id: `new-secret-${config.gsm.secrets.length}` }]}}));
  };
  const removeGsmSecret = (index: number) => {
    const newSecrets = config.gsm.secrets.filter((_, i) => i !== index);
    setConfig(prev => ({...prev, gsm: {...prev.gsm, secrets: newSecrets}}));
  };

  // IAM Handlers
  const handleIamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfig(prev => ({...prev, iam: {...prev.iam, [e.target.name]: e.target.value}}));
  };
  const handleIamRoleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const newRoles = [...config.iam.projectRoles];
      newRoles[index] = e.target.value;
      setConfig(prev => ({...prev, iam: {...prev.iam, projectRoles: newRoles}}));
  };
  const addIamRole = () => {
      setConfig(prev => ({...prev, iam: {...prev.iam, projectRoles: [...prev.iam.projectRoles, '']}}));
  };
  const removeIamRole = (index: number) => {
      const newRoles = config.iam.projectRoles.filter((_, i) => i !== index);
      setConfig(prev => ({...prev, iam: {...prev.iam, projectRoles: newRoles}}));
  };

  // Cloud Run Handlers
  const handleCloudRunChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
        ...prev,
        cloudRun: {
            ...prev.cloudRun,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) || 0 : value)
        }
    }));
  };

  // Cloud Storage Handlers
  const handleBucketChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newBuckets = [...config.cloudStorage.buckets];
    const bucket = { ...newBuckets[index] };
    const { name, value, type, checked } = e.target;

    (bucket as any)[name] = type === 'checkbox' ? checked : value;

    newBuckets[index] = bucket;
    setConfig(prev => ({ ...prev, cloudStorage: { ...prev.cloudStorage, buckets: newBuckets } }));
  };

  const addBucket = () => {
    const newBucket: StorageBucket = {
      name: `new-bucket-${config.cloudStorage.buckets.length + 1}`,
      location: 'US',
      storageClass: 'STANDARD',
      versioningEnabled: false,
    };
    setConfig(prev => ({
      ...prev,
      cloudStorage: {
        ...prev.cloudStorage,
        buckets: [...prev.cloudStorage.buckets, newBucket]
      }
    }));
  };

  const removeBucket = (index: number) => {
    const newBuckets = config.cloudStorage.buckets.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, cloudStorage: { ...prev.cloudStorage, buckets: newBuckets } }));
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-2xl font-bold text-white">Infrastructure Configuration</h2>
        <p className="text-gray-400">Define your GCP resources below. Enable the modules you need.</p>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
            <h3 className="font-bold text-lg text-white">Project Setup</h3>
            <Input label="GCP Project ID" id="projectId" name="projectId" value={config.projectId} onChange={handleGeneralChange} />
            <Input label="Default Region" id="region" name="region" value={config.region} onChange={handleGeneralChange} />
            <Input label="Terraform State GCS Bucket Name" id="bucketName" name="bucketName" value={config.bucketName} onChange={handleGeneralChange} />
        </div>

        <Section title="VPC & Subnets" enabled={config.vpc.enabled} onToggle={(e) => handleSectionToggle('vpc', e)}>
          <VpcConfig 
            config={config.vpc} 
            region={config.region}
            onVpcChange={handleVpcChange}
            onSubnetChange={handleSubnetChange}
            onAddSubnet={addSubnet}
            onRemoveSubnet={removeSubnet}
          />
        </Section>
        
        <Section title="Google Kubernetes Engine" enabled={config.gke.enabled} onToggle={(e) => handleSectionToggle('gke', e)}>
           <GkeConfig
             config={config.gke}
             onClusterChange={handleGkeClusterChange}
             onNodePoolChange={handleNodePoolChange}
             onAddNodePool={addNodePool}
             onRemoveNodePool={removeNodePool}
           />
        </Section>
        
        <Section title="Compute Engine" enabled={config.compute.enabled} onToggle={(e) => handleSectionToggle('compute', e)}>
           <ComputeConfig config={config.compute} onChange={handleComputeChange} />
        </Section>

        <Section title="Cloud SQL" enabled={config.cloudsql.enabled} onToggle={(e) => handleSectionToggle('cloudsql', e)}>
           <CloudSqlConfig 
            config={config.cloudsql}
            onSqlChange={handleCloudSqlChange}
            onBackupChange={handleCloudSqlBackupChange}
           />
        </Section>
        
        <Section title="Firewall Rules" enabled={config.firewall.enabled} onToggle={(e) => handleSectionToggle('firewall', e)}>
            <FirewallConfig
              rules={config.firewall.rules}
              onRuleChange={handleFirewallRuleChange}
              onAllowedChange={handleFirewallAllowedChange}
              onAddAllowed={addFirewallAllowed}
              onRemoveAllowed={removeFirewallAllowed}
              onAddRule={addFirewallRule}
              onRemoveRule={removeFirewallRule}
            />
        </Section>
        
        <Section title="Secret Manager" enabled={config.gsm.enabled} onToggle={(e) => handleSectionToggle('gsm', e)}>
           <GsmConfig
            secrets={config.gsm.secrets}
            onChange={handleGsmChange}
            onAdd={addGsmSecret}
            onRemove={removeGsmSecret}
           />
        </Section>
        
        <Section title="IAM & Service Accounts" enabled={config.iam.enabled} onToggle={(e) => handleSectionToggle('iam', e)}>
           <IamConfig
            config={config.iam}
            onIamChange={handleIamChange}
            onRoleChange={handleIamRoleChange}
            onAddRole={addIamRole}
            onRemoveRole={removeIamRole}
           />
        </Section>

        <Section title="Cloud Run" enabled={config.cloudRun.enabled} onToggle={(e) => handleSectionToggle('cloudRun', e)}>
            <CloudRunConfig
                config={config.cloudRun}
                onChange={handleCloudRunChange}
            />
        </Section>
        
        <Section title="Cloud Storage" enabled={config.cloudStorage.enabled} onToggle={(e) => handleSectionToggle('cloudStorage', e)}>
            <CloudStorageConfig
                config={config.cloudStorage}
                onBucketChange={handleBucketChange}
                onAddBucket={addBucket}
                onRemoveBucket={removeBucket}
            />
        </Section>

      </div>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Code...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" /> Generate IaC with Gemini
            </>
          )}
        </button>
      </div>
    </div>
  );
};