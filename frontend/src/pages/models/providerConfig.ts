export const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "google", label: "Google" },
  { value: "minimax", label: "MiniMax" },
  { value: "zhipu", label: "智谱 AI" },
  { value: "moonshot", label: "Moonshot" },
  { value: "qianwen", label: "通义千问" },
  { value: "custom", label: "自定义" },
];

export const PROVIDER_COLORS: Record<string, string> = {
  openai: "green",
  anthropic: "orange",
  zhipu: "blue",
  moonshot: "purple",
  qianwen: "cyan",
  deepseek: "volcano",
  google: "geekblue",
  minimax: "magenta",
  custom: "default",
};

export const PROVIDER_DEFAULT_URLS: Record<string, string> = {
  deepseek: "https://api.deepseek.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta/openai/",
  minimax: "https://api.minimax.chat/v1",
  zhipu: "https://open.bigmodel.cn/api/paas/v4",
  moonshot: "https://api.moonshot.cn/v1",
  qianwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
};
