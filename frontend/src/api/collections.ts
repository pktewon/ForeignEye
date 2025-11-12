import { apiClient } from './client'
import {
  ApiResponse,
  CollectConceptRequest,
  CollectConceptResponse,
  UserCollectionResponse,
} from '@/types'

export const collectionsApi = {
  collectConcept: async (
    conceptId: number
  ): Promise<CollectConceptResponse> => {
    const response = await apiClient.post<ApiResponse<CollectConceptResponse>>(
      '/collections/concepts',
      { concept_id: conceptId } as CollectConceptRequest
    )
    return response.data.data
  },

  getMyCollections: async (params?: {
    sort?: 'collected_at' | 'name'
    order?: 'asc' | 'desc'
  }): Promise<UserCollectionResponse> => {
    const response = await apiClient.get<
      ApiResponse<UserCollectionResponse>
    >('/collections/concepts', { params })
    return response.data.data
  },

  removeConcept: async (conceptId: number): Promise<void> => {
    await apiClient.delete(`/collections/concepts/${conceptId}`)
  },
}
