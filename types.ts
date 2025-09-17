export interface Subnet {
  name: string;
  cidr: string;
  region: string;
}

export interface VpcConfig {
  enabled: boolean;
  name: string;
  subnets: Subnet[];
}

export interface GkeNodePool {
  name: string;
  nodeCount: number;
  machineType: string;
  diskSizeGb: number;
  autoscaling: boolean;
  minNodeCount: number;
  maxNodeCount: number;
}

export interface GkeConfig {
  enabled: boolean;
  name: string;
  network: string;
  subnetwork: string;
  nodePools: GkeNodePool[];
}

export interface ComputeConfig {
  enabled: boolean;
  name: string;
  machineType: string;
  zone: string;
  image: string;
  startupScript?: string;
}

export interface CloudSqlBackupConfig {
  enabled: boolean;
  startTime: string; // "HH:MM"
}

export interface CloudSqlConfig {
  enabled: boolean;
  name: string;
  databaseVersion: string;
  tier: string;
  highAvailability: boolean;
  backupConfiguration: CloudSqlBackupConfig;
}

export interface FirewallRuleAllowed {
  protocol: string;
  ports?: string[];
}

export interface FirewallRule {
  name: string;
  direction: string;
  priority: number;
  ranges: string[];
  allowed: FirewallRuleAllowed[];
}

export interface FirewallConfig {
  enabled: boolean;
  rules: FirewallRule[];
}

export interface GsmSecret {
  id: string;
}

export interface GsmConfig {
  enabled: boolean;
  secrets: GsmSecret[];
}

export interface IamConfig {
  enabled: boolean;
  serviceAccountName: string;
  projectRoles: string[];
}

export interface CloudRunConfig {
  enabled: boolean;
  name: string;
  location: string;
  image: string;
  cpu: string;
  memory: string;
  minInstances: number;
  maxInstances: number;
  allowUnauthenticated: boolean;
}

export interface StorageBucket {
  name: string;
  location: string;
  storageClass: string;
  versioningEnabled: boolean;
}

export interface CloudStorageConfig {
  enabled: boolean;
  buckets: StorageBucket[];
}

export interface GcpConfig {
  projectId: string;
  region: string;
  bucketName: string;
  vpc: VpcConfig;
  gke: GkeConfig;
  compute: ComputeConfig;
  cloudsql: CloudSqlConfig;
  firewall: FirewallConfig;
  gsm: GsmConfig;
  iam: IamConfig;
  cloudRun: CloudRunConfig;
  cloudStorage: CloudStorageConfig;
}

export interface GeneratedFiles {
  main_tf: string;
  variables_tf: string;
  outputs_tf: string;
  readme_md: string;
  setup_sh: string;
  license: string;
}