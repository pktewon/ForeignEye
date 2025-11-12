import { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Skeleton,
  Flex,
  IconButton,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { articlesApi } from '@/api/articles'

export const ArticlesPage = () => {
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', page, limit],
    queryFn: () => articlesApi.getArticles({ page, limit, sort: 'created_at', order: 'desc' }),
  })

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={10}>
          <Text color="red.500">기사를 불러오는데 실패했습니다.</Text>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="xl">기술 기사 탐험</Heading>
        <Text color="gray.600">
          최신 기술 기사를 읽고 개념을 수집하세요
        </Text>

        {isLoading ? (
          <VStack spacing={4}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height="150px" width="100%" borderRadius="lg" />
            ))}
          </VStack>
        ) : (
          <>
            <VStack spacing={4}>
              {data?.items.map((article) => (
                <Card
                  key={article.article_id}
                  width="100%"
                  variant="outline"
                  _hover={{ boxShadow: 'md', cursor: 'pointer' }}
                  as={Link}
                  to={`/articles/${article.article_id}`}
                >
                  <CardHeader pb={2}>
                    <VStack align="stretch" spacing={2}>
                      <Heading size="md">
                        {article.title_ko || article.title}
                      </Heading>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(article.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </VStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack align="stretch" spacing={3}>
                      <Text noOfLines={2} color="gray.600">
                        {article.summary_ko}
                      </Text>
                      {article.preview_concepts && article.preview_concepts.length > 0 && (
                        <HStack wrap="wrap" spacing={2}>
                          {article.preview_concepts.slice(0, 5).map((concept) => (
                            <Badge key={concept.concept_id} colorScheme="blue" fontSize="xs">
                              {concept.name}
                            </Badge>
                          ))}
                          {(article.concept_count ?? 0) > 5 && (
                            <Badge colorScheme="gray" fontSize="xs">
                              +{(article.concept_count ?? 0) - 5} 더보기
                            </Badge>
                          )}
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>

            {/* Pagination */}
            {data?.pagination && (
              <Flex justify="center" align="center" gap={4} pt={4}>
                <IconButton
                  aria-label="Previous page"
                  icon={<ChevronLeftIcon />}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  isDisabled={!data.pagination.has_prev}
                />
                <Text>
                  페이지 {data.pagination.current_page} / {data.pagination.total_pages}
                </Text>
                <IconButton
                  aria-label="Next page"
                  icon={<ChevronRightIcon />}
                  onClick={() => setPage((p) => p + 1)}
                  isDisabled={!data.pagination.has_next}
                />
              </Flex>
            )}
          </>
        )}
      </VStack>
    </Container>
  )
}
