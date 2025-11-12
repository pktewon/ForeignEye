// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// User types
export interface User {
  user_id: number
  username: string
  email: string
  stats?: UserStats
}

export interface UserStats {
  total_concepts: number
  total_articles: number
}

// Auth types
export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
  message: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  password_confirm: string
}

// Article types
export interface Article {
  article_id: number
  title: string
  title_ko: string | null
  original_url: string
  summary_ko: string
  created_at: string
  concept_count?: number
  preview_concepts?: PreviewConcept[]
}

export interface PreviewConcept {
  concept_id: number
  name: string
}

export interface ArticlesResponse {
  items: Article[]
  pagination: Pagination
}

export interface Pagination {
  current_page: number
  total_pages: number
  total_items: number
  items_per_page: number
  has_next: boolean
  has_prev: boolean
}

export interface GetArticlesParams {
  page?: number
  limit?: number
  sort?: 'created_at' | 'title'
  order?: 'asc' | 'desc'
}

// Concept types
export interface Concept {
  concept_id: number
  name: string
  description_ko?: string
  real_world_examples_ko?: string[]
  is_collected?: boolean
  is_primary?: boolean
}

export interface ConceptNode extends Concept {
  id: number
  label: string
  description: string
  real_world_examples: string[]
  is_collected: boolean
  is_primary: boolean
}

export interface GraphEdge {
  from: number
  to: number
  strength: number
}

export interface KnowledgeGraph {
  nodes: ConceptNode[]
  edges: GraphEdge[]
}

export interface ArticleDetail extends Article {
  graph: KnowledgeGraph
}

export interface ArticleDetailResponse {
  article: ArticleDetail
}

// Collection types
export interface CollectConceptRequest {
  concept_id: number
}

export interface CollectConceptResponse {
  collection: {
    user_id: number
    concept_id: number
    collected_at: string
  }
  concept_name: string
  new_connections: Array<{
    concept_id: number
    name: string
    strength: number
  }>
  message: string
}

export interface UserCollectionResponse {
  concepts: Concept[]
  total_concepts: number
}
