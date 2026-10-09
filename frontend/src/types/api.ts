export interface PredictRequest {
  content: string;
  headline?: string;
}

export interface ProbabilityItem {
  class_index: number;
  label_name: string;
  display_name: string;
  display_name_bn: string;
  probability: number;
  percentage: number;
}

export interface PredictResponse {
  predicted_class: number;
  predicted_label: string;
  display_label: string;
  display_label_bn: string;
  confidence: number;
  confidence_percentage: number;
  probabilities: Record<string, number>;
  detailed_probabilities: ProbabilityItem[];
  headline?: string;
  char_count: number;
  word_count: number;
  explanation: string;
  explanation_bn: string;
  disclaimer: string;
  model_name: string;
  model_type: string;
  top_fake_indicators?: string[];
  top_authentic_indicators?: string[];
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_name: string;
  model_type: string;
  classes: number[];
  version: string;
}

export interface MetadataResponse {
  model_name: string;
  model_type: string;
  input_feature: string;
  input_expected: string;
  prediction_mapping: Record<string, string>;
  training_rows?: number;
  authentic_labelled_rows?: number;
  fake_labelled_rows?: number;
  training_data?: string;
  warning?: string;
}

export interface ExampleNews {
  id: string;
  title: string;
  title_en: string;
  category: string;
  category_en: string;
  tag: 'authentic' | 'fake';
  headline: string;
  content: string;
}
