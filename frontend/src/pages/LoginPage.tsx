import { useState } from 'react'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link as ChakraLink,
  useColorModeValue,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login({ username, password })
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Container maxW="md" py={20}>
      <Box
        bg={bgColor}
        p={8}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        boxShadow="lg"
      >
        <VStack spacing={6} align="stretch">
          <VStack spacing={2}>
            <Heading size="lg">ForeignEye</Heading>
            <Text color="gray.600" fontSize="sm">
              지식 탐험의 세계로 들어오세요
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>사용자명</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>비밀번호</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                isLoading={isLoading}
                loadingText="로그인 중..."
              >
                로그인
              </Button>
            </VStack>
          </form>

          <Text textAlign="center" fontSize="sm">
            계정이 없으신가요?{' '}
            <ChakraLink as={Link} to="/register" color="blue.500">
              회원가입
            </ChakraLink>
          </Text>
        </VStack>
      </Box>
    </Container>
  )
}
