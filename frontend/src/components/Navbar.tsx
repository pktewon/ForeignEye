import {
  Box,
  Flex,
  Button,
  Heading,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { useAuth } from '@/contexts/AuthContext'

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box
      as="nav"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={6}
      py={4}
      position="sticky"
      top={0}
      zIndex={10}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
        <Heading size="md" as={Link} to="/" cursor="pointer">
          🌍 ForeignEye
        </Heading>

        {isAuthenticated ? (
          <HStack spacing={4}>
            <Button as={Link} to="/articles" variant="ghost">
              기사 탐험
            </Button>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="ghost">
                <HStack spacing={2}>
                  <Text>{user?.username}</Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => navigate('/collections')}>
                  내 컬렉션
                </MenuItem>
                <MenuItem onClick={logout}>로그아웃</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        ) : (
          <HStack spacing={4}>
            <Button as={Link} to="/login" variant="ghost">
              로그인
            </Button>
            <Button as={Link} to="/register" colorScheme="blue">
              회원가입
            </Button>
          </HStack>
        )}
      </Flex>
    </Box>
  )
}
