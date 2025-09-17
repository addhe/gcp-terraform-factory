import React from 'react';
import type { VpcConfig as VpcConfigType, GkeConfig as GkeConfigType, ComputeConfig as ComputeConfigType, CloudSqlConfig as CloudSqlConfigType, FirewallRule, GsmSecret, IamConfig as IamConfigType, CloudRunConfig as CloudRunConfigType, CloudStorageConfig as CloudStorageConfigType } from '../../types';
import { Input, Select, Textarea } from '../common/FormControls';
import { PlusIcon, TrashIcon } from '../icons';

// VPC Config
interface VpcConfigProps {
    config: VpcConfigType;
    region: string;
    onVpcChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubnetChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddSubnet: () => void;
    onRemoveSubnet: (index: number) => void;
}
export const VpcConfig: React.FC<VpcConfigProps> = ({ config, onVpcChange, onSubnetChange, onAddSubnet, onRemoveSubnet }) => (
    <>
        <Input label="VPC Name" id="vpcName" name="name" value={config.name} onChange={onVpcChange} />
        {config.subnets.map((subnet, index) => (
            <div key={index} className="p-3 bg-gray-800/50 border border-gray-700 rounded-md space-y-2 relative">
                <Input label="Subnet Name" id={`subnetName-${index}`} name="name" value={subnet.name} onChange={(e) => onSubnetChange(index, e)} />
                <Input label="Subnet CIDR" id={`subnetCidr-${index}`} name="cidr" value={subnet.cidr} onChange={(e) => onSubnetChange(index, e)} />
                <Input label="Subnet Region" id={`subnetRegion-${index}`} name="region" value={subnet.region} onChange={(e) => onSubnetChange(index, e)} />
                <button onClick={() => onRemoveSubnet(index)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
            </div>
        ))}
        <button onClick={onAddSubnet} className="w-full flex items-center justify-center gap-2 text-sm text-purple-400 border-2 border-dashed border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:border-purple-500 transition-colors">
            <PlusIcon className="w-4 h-4" /> Add Subnet
        </button>
    </>
);

// GKE Config
interface GkeConfigProps {
    config: GkeConfigType;
    onClusterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNodePoolChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddNodePool: () => void;
    onRemoveNodePool: (index: number) => void;
}
export const GkeConfig: React.FC<GkeConfigProps> = ({ config, onClusterChange, onNodePoolChange, onAddNodePool, onRemoveNodePool }) => (
    <>
        <Input label="Cluster Name" id="gkeName" name="name" value={config.name} onChange={onClusterChange} />
        <Input label="Network" id="gkeNetwork" name="network" value={config.network} onChange={onClusterChange} placeholder="e.g., main-vpc" />
        <Input label="Subnetwork" id="gkeSubnetwork" name="subnetwork" value={config.subnetwork} onChange={onClusterChange} placeholder="e.g., web-subnet" />
        <h4 className="text-md font-semibold text-gray-300 pt-2">Node Pools</h4>
        {config.nodePools.map((pool, index) => (
            <div key={index} className="p-3 bg-gray-800/50 border border-gray-700 rounded-md space-y-3 relative">
                <button onClick={() => onRemoveNodePool(index)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                <Input label="Node Pool Name" id={`npName-${index}`} name="name" value={pool.name} onChange={(e) => onNodePoolChange(index, e)} />
                <div className="grid grid-cols-2 gap-2">
                    <Input label="Machine Type" id={`npMachineType-${index}`} name="machineType" value={pool.machineType} onChange={(e) => onNodePoolChange(index, e)} />
                    <Input label="Disk Size (GB)" id={`npDiskSize-${index}`} name="diskSizeGb" type="number" min="10" value={pool.diskSizeGb} onChange={(e) => onNodePoolChange(index, e)} />
                </div>
                <div className="flex items-center justify-between pt-1">
                    <label htmlFor={`npAutoscaling-${index}`} className="block text-sm font-medium text-gray-400">Autoscaling</label>
                    <label htmlFor={`npAutoscaling-${index}`} className="cursor-pointer">
                        <div className={`relative inline-block w-12 h-6 rounded-full transition-colors duration-300 ${pool.autoscaling ? 'bg-purple-500' : 'bg-gray-700'}`}>
                            <input type="checkbox" id={`npAutoscaling-${index}`} name="autoscaling" checked={pool.autoscaling} onChange={(e) => onNodePoolChange(index, e)} className="absolute opacity-0 w-0 h-0" />
                            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${pool.autoscaling ? 'transform translate-x-6' : ''}`}></span>
                        </div>
                    </label>
                </div>
                {pool.autoscaling ? (
                    <div className="grid grid-cols-2 gap-2">
                        <Input label="Min Nodes" id={`npMinNodes-${index}`} name="minNodeCount" type="number" min="0" value={pool.minNodeCount} onChange={(e) => onNodePoolChange(index, e)} />
                        <Input label="Max Nodes" id={`npMaxNodes-${index}`} name="maxNodeCount" type="number" min="1" value={pool.maxNodeCount} onChange={(e) => onNodePoolChange(index, e)} />
                    </div>
                ) : (
                    <Input label="Node Count" id={`npNodeCount-${index}`} name="nodeCount" type="number" min="1" value={pool.nodeCount} onChange={(e) => onNodePoolChange(index, e)} />
                )}
            </div>
        ))}
        <button onClick={onAddNodePool} className="w-full flex items-center justify-center gap-2 text-sm text-purple-400 border-2 border-dashed border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:border-purple-500 transition-colors">
            <PlusIcon className="w-4 h-4" /> Add Node Pool
        </button>
    </>
);

// Compute Config
interface ComputeConfigProps {
    config: ComputeConfigType;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}
export const ComputeConfig: React.FC<ComputeConfigProps> = ({ config, onChange }) => (
    <>
        <Input label="Instance Name" id="computeName" name="name" value={config.name} onChange={onChange} />
        <Input label="Machine Type" id="computeMachineType" name="machineType" value={config.machineType} onChange={onChange} />
        <Input label="Zone" id="computeZone" name="zone" value={config.zone} onChange={onChange} />
        <Input label="Boot Disk Image" id="computeImage" name="image" value={config.image} onChange={onChange} />
        <Textarea
            label="Startup Script"
            id="computeStartupScript"
            name="startupScript"
            value={config.startupScript || ''}
            onChange={onChange}
            placeholder={`#!/bin/bash
# Example: Install a web server
apt-get update
apt-get install -y nginx
echo "Hello from $(hostname)" > /var/www/html/index.html`}
        />
    </>
);

// Cloud SQL Config
interface CloudSqlConfigProps {
    config: CloudSqlConfigType;
    onSqlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBackupChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export const CloudSqlConfig: React.FC<CloudSqlConfigProps> = ({ config, onSqlChange, onBackupChange }) => (
    <>
        <Input label="Instance Name" id="sqlName" name="name" value={config.name} onChange={onSqlChange} />
        <Input label="Database Version" id="sqlDbVersion" name="databaseVersion" value={config.databaseVersion} onChange={onSqlChange} placeholder="e.g., POSTGRES_14, MYSQL_8_0" />
        <Input label="Machine Type / Tier" id="sqlTier" name="tier" value={config.tier} onChange={onSqlChange} placeholder="e.g., db-g1-small" />
        <div className="flex items-center justify-between pt-2">
            <label htmlFor="sqlHA" className="block text-sm font-medium text-gray-400">High Availability (Regional)</label>
            <label htmlFor="sqlHA" className="cursor-pointer">
                <div className={`relative inline-block w-12 h-6 rounded-full transition-colors duration-300 ${config.highAvailability ? 'bg-purple-500' : 'bg-gray-700'}`}>
                    <input type="checkbox" id="sqlHA" name="highAvailability" checked={config.highAvailability} onChange={onSqlChange} className="absolute opacity-0 w-0 h-0" />
                    <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${config.highAvailability ? 'transform translate-x-6' : ''}`}></span>
                </div>
            </label>
        </div>
        <div className="pt-3">
            <h4 className="text-md font-semibold text-gray-300 pt-3 border-t border-gray-800">Backup Configuration</h4>
            <div className="mt-2 space-y-3">
                <div className="flex items-center justify-between">
                    <label htmlFor="sqlBackupEnabled" className="block text-sm font-medium text-gray-400">Enable Backups</label>
                    <label htmlFor="sqlBackupEnabled" className="cursor-pointer">
                        <div className={`relative inline-block w-12 h-6 rounded-full transition-colors duration-300 ${config.backupConfiguration.enabled ? 'bg-purple-500' : 'bg-gray-700'}`}>
                            <input type="checkbox" id="sqlBackupEnabled" name="enabled" checked={config.backupConfiguration.enabled} onChange={onBackupChange} className="absolute opacity-0 w-0 h-0" />
                            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${config.backupConfiguration.enabled ? 'transform translate-x-6' : ''}`}></span>
                        </div>
                    </label>
                </div>
                {config.backupConfiguration.enabled && (
                    <Input label="Backup Start Time (HH:MM UTC)" id="sqlBackupStartTime" name="startTime" value={config.backupConfiguration.startTime} onChange={onBackupChange} placeholder="e.g., 04:00" />
                )}
            </div>
        </div>
    </>
);

// Firewall Config
interface FirewallConfigProps {
    rules: FirewallRule[];
    onRuleChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onAllowedChange: (ruleIndex: number, allowedIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddAllowed: (ruleIndex: number) => void;
    onRemoveAllowed: (ruleIndex: number, allowedIndex: number) => void;
    onAddRule: () => void;
    onRemoveRule: (index: number) => void;
}
export const FirewallConfig: React.FC<FirewallConfigProps> = ({ rules, onRuleChange, onAllowedChange, onAddAllowed, onRemoveAllowed, onAddRule, onRemoveRule }) => (
    <>
        {rules.map((rule, index) => (
            <div key={index} className="p-3 bg-gray-800/50 border border-gray-700 rounded-md space-y-3 relative">
                <button onClick={() => onRemoveRule(index)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                <Input label="Rule Name" id={`fwName-${index}`} name="name" value={rule.name} onChange={(e) => onRuleChange(index, e)} />
                <div className="grid grid-cols-2 gap-2">
                    <Select label="Direction" id={`fwDir-${index}`} name="direction" value={rule.direction} onChange={(e) => onRuleChange(index, e)}>
                        <option value="INGRESS">INGRESS</option>
                        <option value="EGRESS">EGRESS</option>
                    </Select>
                    <Input label="Priority" id={`fwPri-${index}`} name="priority" type="number" value={rule.priority} onChange={(e) => onRuleChange(index, e)} />
                </div>
                <Input
                    label={rule.direction === 'INGRESS' ? 'Source Ranges (CSV)' : 'Destination Ranges (CSV)'}
                    id={`fwRanges-${index}`} name="ranges" value={rule.ranges.join(', ')}
                    onChange={(e) => onRuleChange(index, e)}
                />
                <div className="pt-2">
                    <h5 className="text-sm font-semibold text-gray-300 mb-2">Allowed Protocols</h5>
                    <div className="space-y-2">
                        {rule.allowed.map((allow, allowIndex) => (
                            <div key={allowIndex} className="flex items-end gap-2 p-2 bg-gray-900/50 rounded-md border border-gray-700/50">
                                <div className="flex-grow grid grid-cols-2 gap-2">
                                    <Input
                                        label="Protocol"
                                        id={`fwProto-${index}-${allowIndex}`}
                                        name="protocol"
                                        value={allow.protocol}
                                        onChange={(e) => onAllowedChange(index, allowIndex, e)}
                                        placeholder="e.g., tcp, udp, icmp"
                                    />
                                    <Input
                                        label="Ports (CSV, optional)"
                                        id={`fwPorts-${index}-${allowIndex}`}
                                        name="ports"
                                        value={allow.ports?.join(', ') || ''}
                                        onChange={(e) => onAllowedChange(index, allowIndex, e)}
                                        placeholder="e.g. 80, 443"
                                    />
                                </div>
                                <button
                                    onClick={() => onRemoveAllowed(index, allowIndex)}
                                    disabled={rule.allowed.length <= 1}
                                    className="p-2 text-gray-500 hover:text-red-400 disabled:text-gray-700 disabled:cursor-not-allowed"
                                    title="Remove protocol"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => onAddAllowed(index)} className="mt-2 w-full flex items-center justify-center gap-2 text-xs text-purple-400 border-2 border-dashed border-gray-700 rounded-md py-1 hover:bg-gray-800 hover:border-purple-500 transition-colors">
                        <PlusIcon className="w-3 h-3" /> Add Protocol
                    </button>
                </div>
            </div>
        ))}
        <button onClick={onAddRule} className="w-full flex items-center justify-center gap-2 text-sm text-purple-400 border-2 border-dashed border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:border-purple-500 transition-colors">
            <PlusIcon className="w-4 h-4" /> Add Firewall Rule
        </button>
    </>
);

// GSM Config
interface GsmConfigProps {
    secrets: GsmSecret[];
    onChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}
export const GsmConfig: React.FC<GsmConfigProps> = ({ secrets, onChange, onAdd, onRemove }) => (
    <>
        {secrets.map((secret, index) => (
            <div key={index} className="flex items-center gap-2">
                <Input label="Secret ID" id={`gsmId-${index}`} name="id" value={secret.id} onChange={(e) => onChange(index, e)} />
                <button onClick={() => onRemove(index)} className="mt-6 p-2 text-gray-500 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>
            </div>
        ))}
        <button onClick={onAdd} className="w-full flex items-center justify-center gap-2 text-sm text-purple-400 border-2 border-dashed border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:border-purple-500 transition-colors">
            <PlusIcon className="w-4 h-4" /> Add Secret
        </button>
    </>
);

// IAM Config
interface IamConfigProps {
    config: IamConfigType;
    onIamChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRoleChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddRole: () => void;
    onRemoveRole: (index: number) => void;
}
export const IamConfig: React.FC<IamConfigProps> = ({ config, onIamChange, onRoleChange, onAddRole, onRemoveRole }) => (
    <>
        <Input label="Service Account Name" id="iamSaName" name="serviceAccountName" value={config.serviceAccountName} onChange={onIamChange} placeholder="e.g., my-app-sa" />
        <div className="pt-3">
            <h4 className="text-md font-semibold text-gray-300 pt-3 border-t border-gray-800">Project-level Roles</h4>
            <div className="mt-2 space-y-2">
                {config.projectRoles.map((role, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            label={`Role #${index + 1}`}
                            id={`iamRole-${index}`}
                            name="role"
                            value={role}
                            onChange={(e) => onRoleChange(index, e)}
                            placeholder="e.g., roles/storage.admin"
                        />
                        <button onClick={() => onRemoveRole(index)} className="mt-6 p-2 text-gray-500 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                ))}
            </div>
            <button onClick={onAddRole} className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-purple-400 border-2 border-dashed border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:border-purple-500 transition-colors">
                <PlusIcon className="w-4 h-4" /> Add Role Binding
            </button>
        </div>
    </>
);

// Cloud Run Config
interface CloudRunConfigProps {
  config: CloudRunConfigType;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export const CloudRunConfig: React.FC<CloudRunConfigProps> = ({ config, onChange }) => (
    <>
        <Input label="Service Name" id="crName" name="name" value={config.name} onChange={onChange} />
        <Input label="Location" id="crLocation" name="location" value={config.location} onChange={onChange} />
        <Input label="Container Image URL" id="crImage" name="image" value={config.image} onChange={onChange} />
        <div className="grid grid-cols-2 gap-2">
            <Input label="CPU" id="crCpu" name="cpu" value={config.cpu} onChange={onChange} placeholder="e.g., 1 or 1000m" />
            <Input label="Memory" id="crMemory" name="memory" value={config.memory} onChange={onChange} placeholder="e.g., 512Mi" />
        </div>
        <h4 className="text-md font-semibold text-gray-300 pt-2">Scaling</h4>
        <div className="grid grid-cols-2 gap-2">
            <Input label="Min Instances" id="crMinInstances" name="minInstances" type="number" min="0" value={config.minInstances} onChange={onChange} />
            <Input label="Max Instances" id="crMaxInstances" name="maxInstances" type="number" min="0" value={config.maxInstances} onChange={onChange} />
        </div>
         <div className="flex items-center justify-between pt-2">
            <label htmlFor="crAuth" className="block text-sm font-medium text-gray-400">Allow Unauthenticated Invocations</label>
            <label htmlFor="crAuth" className="cursor-pointer">
                <div className={`relative inline-block w-12 h-6 rounded-full transition-colors duration-300 ${config.allowUnauthenticated ? 'bg-purple-500' : 'bg-gray-700'}`}>
                    <input type="checkbox" id="crAuth" name="allowUnauthenticated" checked={config.allowUnauthenticated} onChange={onChange} className="absolute opacity-0 w-0 h-0" />
                    <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${config.allowUnauthenticated ? 'transform translate-x-6' : ''}`}></span>
                </div>
            </label>
        </div>
    </>
);

// Cloud Storage Config
interface CloudStorageConfigProps {
    config: CloudStorageConfigType;
    onBucketChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddBucket: () => void;
    onRemoveBucket: (index: number) => void;
}
export const CloudStorageConfig: React.FC<CloudStorageConfigProps> = ({ config, onBucketChange, onAddBucket, onRemoveBucket }) => (
    <>
        <h4 className="text-md font-semibold text-gray-300">Buckets</h4>
        {config.buckets.map((bucket, index) => (
            <div key={index} className="p-3 bg-gray-800/50 border border-gray-700 rounded-md space-y-3 relative">
                 <button onClick={() => onRemoveBucket(index)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                 <Input label="Bucket Name" id={`csName-${index}`} name="name" value={bucket.name} onChange={(e) => onBucketChange(index, e)} />
                 <div className="grid grid-cols-2 gap-2">
                    <Input label="Location" id={`csLocation-${index}`} name="location" value={bucket.location} onChange={(e) => onBucketChange(index, e)} />
                    <Input label="Storage Class" id={`csClass-${index}`} name="storageClass" value={bucket.storageClass} onChange={(e) => onBucketChange(index, e)} />
                 </div>
                 <div className="flex items-center justify-between pt-1">
                    <label htmlFor={`csVersioning-${index}`} className="block text-sm font-medium text-gray-400">Enable Versioning</label>
                    <label htmlFor={`csVersioning-${index}`} className="cursor-pointer">
                        <div className={`relative inline-block w-12 h-6 rounded-full transition-colors duration-300 ${bucket.versioningEnabled ? 'bg-purple-500' : 'bg-gray-700'}`}>
                            <input type="checkbox" id={`csVersioning-${index}`} name="versioningEnabled" checked={bucket.versioningEnabled} onChange={(e) => onBucketChange(index, e)} className="absolute opacity-0 w-0 h-0" />
                            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${bucket.versioningEnabled ? 'transform translate-x-6' : ''}`}></span>
                        </div>
                    </label>
                </div>
            </div>
        ))}
         <button onClick={onAddBucket} className="w-full flex items-center justify-center gap-2 text-sm text-purple-400 border-2 border-dashed border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:border-purple-500 transition-colors">
            <PlusIcon className="w-4 h-4" /> Add Bucket
        </button>
    </>
);