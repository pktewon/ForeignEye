import { apiClient } from './client'
import {
  ApiResponse,
  Article,
  ArticleDetail,
  ArticleDetailResponse,
  ArticlesResponse,
  GetArticlesParams,
} from '@/types'

export const articlesApi = {
  getArticles: async (params?: GetArticlesParams): Promise<ArticlesResponse> => {
    const response = await apiClient.get<ApiResponse<ArticlesResponse>>(
      '/articles',
      { params }
    )
    return response.data.data
  },

  getArticleDetail: async (articleId: number): Promise<ArticleDetail> => {
    const response = await apiClient.get<ApiResponse<ArticleDetailResponse>>(
      `/articles/${articleId}`
    )
    return response.data.data.article
  },
}
