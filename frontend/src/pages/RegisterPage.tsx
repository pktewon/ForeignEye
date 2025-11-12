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
  FormErrorMessage,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export const RegisterPage = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()

  const passwordsMatch = password === passwordConfirm
  const showPasswordError = passwordConfirm.length > 0 && !passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordsMatch) return

    setIsLoading(true)
    try {
      await register({ username, email, password, password_confirm: passwordConfirm })
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
            <Heading size="lg">ForeignEye 가입</Heading>
            <Text color="gray.600" fontSize="sm">
              지식 탐험을 시작하세요
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
                <FormLabel>이메일</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
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

              <FormControl isRequired isInvalid={showPasswordError}>
                <FormLabel>비밀번호 확인</FormLabel>
                <Input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                />
                {showPasswordError && (
                  <FormErrorMessage>비밀번호가 일치하지 않습니다.</FormErrorMessage>
                )}
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                isLoading={isLoading}
                loadingText="가입 중..."
                isDisabled={showPasswordError}
              >
                회원가입
              </Button>
            </VStack>
          </form>

          <Text textAlign="center" fontSize="sm">
            이미 계정이 있으신가요?{' '}
            <ChakraLink as={Link} to="/login" color="blue.500">
              로그인
            </ChakraLink>
          </Text>
        </VStack>
      </Box>
    </Container>
  )
}
