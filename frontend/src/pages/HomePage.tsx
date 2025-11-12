import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export const HomePage = () => {
  const { isAuthenticated } = useAuth()
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50)',
    'linear(to-br, blue.900, purple.900)'
  )

  return (
    <Box minH="calc(100vh - 80px)" bgGradient={bgGradient}>
      <Container maxW="container.md" py={20}>
        <VStack spacing={8} textAlign="center">
          <Heading size="3xl" bgGradient="linear(to-r, blue.500, purple.500)" bgClip="text">
            ForeignEye
          </Heading>
          <Heading size="xl">확장하는 우주를 탐험하세요</Heading>
          <Text fontSize="lg" color="gray.600" maxW="xl">
            3D 지식 그래프를 통해 기술 개념을 탐험하고, 발견하고, 습득하세요.
            게임화된 학습으로 나만의 지식 지도를 성장시키세요.
          </Text>

          <HStack spacing={4} pt={4}>
            {isAuthenticated ? (
              <Button as={Link} to="/articles" size="lg" colorScheme="blue">
                기사 탐험 시작
              </Button>
            ) : (
              <>
                <Button as={Link} to="/register" size="lg" colorScheme="blue">
                  시작하기
                </Button>
                <Button as={Link} to="/login" size="lg" variant="outline">
                  로그인
                </Button>
              </>
            )}
          </HStack>

          <Box pt={8}>
            <VStack spacing={4}>
              <HStack spacing={8}>
                <Box textAlign="center">
                  <Text fontSize="4xl" fontWeight="bold" color="blue.500">
                    🔍
                  </Text>
                  <Text fontWeight="semibold">탐험</Text>
                  <Text fontSize="sm" color="gray.600">
                    개념 노드 클릭
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="4xl" fontWeight="bold" color="purple.500">
                    ✨
                  </Text>
                  <Text fontWeight="semibold">발견</Text>
                  <Text fontSize="sm" color="gray.600">
                    새로운 기사 읽기
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="4xl" fontWeight="bold" color="green.500">
                    🎯
                  </Text>
                  <Text fontWeight="semibold">습득</Text>
                  <Text fontSize="sm" color="gray.600">
                    개념 수집하기
                  </Text>
                </Box>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}
