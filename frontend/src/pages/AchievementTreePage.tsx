import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Progress,
  SimpleGrid,
} from '@chakra-ui/react'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/useAuthStore'
import { FaTrophy, FaStar, FaCrown, FaRocket } from 'react-icons/fa'

const AchievementTreePage = () => {
  const { user } = useAuthStore()

  const achievements = [
    {
      id: '1',
      title: 'Newcomer',
      description: 'Join The Hive community',
      icon: FaRocket,
      level: 'NEWCOMER',
      progress: 100,
      unlocked: true,
      color: 'green',
      requirement: 'Create an account',
    },
    {
      id: '2',
      title: 'First Exchange',
      description: 'Complete your first service exchange',
      icon: FaStar,
      level: 'JR. MEMBER',
      progress: 100,
      unlocked: true,
      color: 'teal',
      requirement: '1 exchange completed',
    },
    {
      id: '3',
      title: 'Active Member',
      description: 'Complete 10 exchanges',
      icon: FaTrophy,
      level: 'SR. MEMBER',
      progress: 40,
      unlocked: false,
      color: 'blue',
      requirement: '10 exchanges (4/10)',
    },
    {
      id: '4',
      title: 'Community Leader',
      description: 'Earn 100+ hours and maintain 4.8+ rating',
      icon: FaCrown,
      level: 'COMMUNITY LEAD',
      progress: 7,
      unlocked: false,
      color: 'purple',
      requirement: '100 hours (7/100)',
    },
  ]

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />

      <Container maxW="1200px" py={10}>
        <VStack spacing={8} align="stretch">
          <VStack spacing={2}>
            <Heading size="2xl" fontWeight="700">
              Achievement Tree
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Track your progress and unlock new badges
            </Text>
          </VStack>

          {/* Current Status */}
          <Box bg="#E2E8F0" p={6} borderRadius="10px">
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" fontWeight="600" color="gray.600">
                  Current Level
                </Text>
                <Badge
                  bg="teal.100"
                  color="teal.800"
                  fontSize="md"
                  fontWeight="700"
                  px={4}
                  py={2}
                >
                  JR. MEMBER
                </Badge>
              </VStack>
              <VStack align="end" spacing={2}>
                <Text fontSize="sm" fontWeight="600" color="gray.600">
                  Time Credits
                </Text>
                <Text fontSize="2xl" fontWeight="700" color="#D69E2E">
                  {user?.profile?.time_credits || 0}H
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Achievements Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {achievements.map((achievement) => {
              const IconComponent = achievement.icon
              return (
                <Box
                  key={achievement.id}
                  bg={achievement.unlocked ? 'white' : '#F7FAFC'}
                  border="2px solid"
                  borderColor={achievement.unlocked ? `${achievement.color}.200` : 'gray.200'}
                  p={6}
                  borderRadius="10px"
                  opacity={achievement.unlocked ? 1 : 0.7}
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
                >
                  <VStack align="stretch" spacing={4}>
                    <HStack justify="space-between">
                      <HStack spacing={3}>
                        <Box
                          p={3}
                          bg={`${achievement.color}.100`}
                          borderRadius="lg"
                          color={`${achievement.color}.600`}
                        >
                          <IconComponent size={24} />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="lg" fontWeight="700">
                            {achievement.title}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {achievement.description}
                          </Text>
                        </VStack>
                      </HStack>
                      <Badge
                        bg={`${achievement.color}.100`}
                        color={`${achievement.color}.800`}
                        fontSize="10px"
                        fontWeight="700"
                        px={2}
                        py={1}
                      >
                        {achievement.level}
                      </Badge>
                    </HStack>

                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="xs" color="gray.600">
                          {achievement.requirement}
                        </Text>
                        <Text fontSize="xs" fontWeight="700" color={`${achievement.color}.600`}>
                          {achievement.progress}%
                        </Text>
                      </HStack>
                      <Progress
                        value={achievement.progress}
                        size="sm"
                        colorScheme={achievement.color}
                        borderRadius="full"
                      />
                    </Box>

                    {achievement.unlocked && (
                      <Badge
                        bg="green.100"
                        color="green.800"
                        fontSize="xs"
                        fontWeight="700"
                        px={3}
                        py={1}
                        alignSelf="flex-start"
                      >
                        ✓ UNLOCKED
                      </Badge>
                    )}
                  </VStack>
                </Box>
              )
            })}
          </SimpleGrid>

          {/* Next Milestone */}
          <Box bg="#FFFFF0" p={6} borderRadius="10px" borderLeft="4px solid" borderColor="yellow.400">
            <HStack spacing={4}>
              <Text fontSize="3xl">🎯</Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="md" fontWeight="700">
                  Next Milestone: SR. MEMBER
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Complete 6 more exchanges to unlock Senior Member status
                </Text>
              </VStack>
            </HStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default AchievementTreePage
