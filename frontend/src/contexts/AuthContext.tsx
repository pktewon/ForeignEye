import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LoginRequest, RegisterRequest } from '@/types'
import { authApi } from '@/api/auth'
import { useToast } from '@chakra-ui/react'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi
        .getMe()
        .then((userData) => {
          setUser(userData)
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data)
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      setUser(response.user)
      toast({
        title: '로그인 성공',
        description: response.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      navigate('/articles')
    } catch (error: any) {
      toast({
        title: '로그인 실패',
        description: error.response?.data?.message || '로그인에 실패했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      throw error
    }
  }

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authApi.register(data)
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      setUser(response.user)
      toast({
        title: '회원가입 성공',
        description: response.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      navigate('/articles')
    } catch (error: any) {
      toast({
        title: '회원가입 실패',
        description: error.response?.data?.message || '회원가입에 실패했습니다.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      throw error
    }
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
    toast({
      title: '로그아웃',
      description: '로그아웃되었습니다.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
    navigate('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
