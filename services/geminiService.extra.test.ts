import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateTerraformCode } from './geminiService';

const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent }
  })),
  Type: { OBJECT: 'object', STRING: 'string' }
}));

declare global { interface Window { GCP_GENERATOR_API_KEY: string } }

const BASIC_CONFIG: any = {
  projectId: 'p', region: 'r', bucketName: 'b', vpc: { enabled: false }, gke: { enabled: false }, compute: { enabled: false }, cloudsql: { enabled: false }, firewall: { enabled: false }, gsm: { enabled: false }, iam: { enabled: false }, cloudRun: { enabled: false }, cloudStorage: { enabled: false }
};

describe('geminiService extra', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.GCP_GENERATOR_API_KEY = 'k';
  });

  it('throws when api returns non-json text', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'not json' });
    await expect(generateTerraformCode(BASIC_CONFIG)).rejects.toThrow(/Failed to generate Terraform code/);
  });

  it('returns defaults when some keys are missing', async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ main_tf: 'm' }) });
    const res = await generateTerraformCode(BASIC_CONFIG);
    expect(res.main_tf).toBe('m');
    expect(res.variables_tf).toBe('');
    expect(res.license).toContain('MIT License');
  });
});
