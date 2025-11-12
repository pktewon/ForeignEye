import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Skeleton,
  Link as ChakraLink,
  useToast,
  Divider,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ExternalLinkIcon, ChevronLeftIcon } from '@chakra-ui/icons'
import { articlesApi } from '@/api/articles'
import { collectionsApi } from '@/api/collections'

export const ArticleDetailPage = () => {
  const { articleId } = useParams<{ articleId: string }>()
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => articlesApi.getArticleDetail(Number(articleId)),
    enabled: !!articleId,
  })

  const collectMutation = useMutation({
    mutationFn: (conceptId: number) => collectionsApi.collectConcept(conceptId),
    onSuccess: (data) => {
      toast({
        title: '개념 수집 완료!',
        description: data.message,
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      // Invalidate article query to refresh collected status
      queryClient.invalidateQueries({ queryKey: ['article', articleId] })
    },
    onError: (error: any) => {
      toast({
        title: '수집 실패',
        description: error.response?.data?.message || '개념 수집에 실패했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={10}>
          <Text color="red.500">기사를 불러오는데 실패했습니다.</Text>
          <Button as={Link} to="/articles" mt={4} leftIcon={<ChevronLeftIcon />}>
            목록으로 돌아가기
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Button
          as={Link}
          to="/articles"
          leftIcon={<ChevronLeftIcon />}
          variant="ghost"
          alignSelf="flex-start"
        >
          기사 목록
        </Button>

        {isLoading ? (
          <VStack spacing={4}>
            <Skeleton height="40px" width="100%" />
            <Skeleton height="20px" width="60%" />
            <Skeleton height="200px" width="100%" />
          </VStack>
        ) : article ? (
          <>
            <VStack align="stretch" spacing={4}>
              <Heading size="xl">{article.title_ko || article.title}</Heading>
              <HStack spacing={4} fontSize="sm" color="gray.500">
                <Text>
                  {new Date(article.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <ChakraLink href={article.original_url} isExternal color="blue.500">
                  원문 보기 <ExternalLinkIcon mx="2px" />
                </ChakraLink>
              </HStack>
            </VStack>

            <Divider />

            <Box>
              <Heading size="md" mb={4}>
                요약
              </Heading>
              <Text lineHeight="tall" whiteSpace="pre-line">
                {article.summary_ko}
              </Text>
            </Box>

            <Divider />

            <Box>
              <Heading size="md" mb={4}>
                이 기사의 개념들
              </Heading>
              <Text fontSize="sm" color="gray.600" mb={4}>
                개념을 클릭하여 내 컬렉션에 추가하세요
              </Text>

              {article.graph?.nodes && article.graph.nodes.length > 0 ? (
                <Wrap spacing={3}>
                  {article.graph.nodes.map((concept) => (
                    <WrapItem key={concept.id}>
                      <Box
                        borderWidth="1px"
                        borderRadius="lg"
                        p={4}
                        bg={concept.is_collected ? 'green.50' : 'white'}
                        borderColor={concept.is_collected ? 'green.300' : 'gray.200'}
                        minW="250px"
                      >
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Badge
                              colorScheme={concept.is_primary ? 'purple' : 'blue'}
                              fontSize="xs"
                            >
                              {concept.is_primary ? 'Primary' : 'Related'}
                            </Badge>
                            {concept.is_collected && (
                              <Badge colorScheme="green" fontSize="xs">
                                수집됨
                              </Badge>
                            )}
                          </HStack>
                          <Text fontWeight="bold">{concept.label}</Text>
                          {concept.description && (
                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                              {concept.description}
                            </Text>
                          )}
                          {concept.real_world_examples && concept.real_world_examples.length > 0 && (
                            <HStack wrap="wrap" spacing={1}>
                              {concept.real_world_examples.slice(0, 3).map((example, idx) => (
                                <Badge key={idx} variant="subtle" fontSize="xs">
                                  {example}
                                </Badge>
                              ))}
                            </HStack>
                          )}
                          <Button
                            size="sm"
                            colorScheme={concept.is_collected ? 'gray' : 'blue'}
                            onClick={() => collectMutation.mutate(concept.id)}
                            isLoading={collectMutation.isPending}
                            isDisabled={concept.is_collected}
                          >
                            {concept.is_collected ? '수집됨' : '+ 수집하기'}
                          </Button>
                        </VStack>
                      </Box>
                    </WrapItem>
                  ))}
                </Wrap>
              ) : (
                <Text color="gray.500">개념 정보가 없습니다.</Text>
              )}
            </Box>
          </>
        ) : null}
      </VStack>
    </Container>
  )
}
