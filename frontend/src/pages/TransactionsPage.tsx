import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useMemo, useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import UserAvatar from '@/components/UserAvatar'
import { transactionService } from '@/services/transaction.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { TimeBankTransaction } from '@/types'
import { MdArrowDownward, MdArrowUpward, MdStar } from 'react-icons/md'

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const TransactionsPage = () => {
  const { user } = useAuthStore()
  const currentUser = user as any
  const [transactions, setTransactions] = useState<TimeBankTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        const data = await transactionService.getTransactions()
        setTransactions(data)
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUser) {
      fetchTransactions()
    }
  }, [currentUser])

  const totalEarned = useMemo(
    () =>
      transactions
        .filter((tx) => tx.transaction_type === 'EARN' && tx.to_user.id === currentUser?.id)
        .reduce((sum, tx) => sum + tx.time_amount, 0),
    [transactions, currentUser?.id]
  )

  const totalSpent = useMemo(
    () =>
      transactions
        .filter((tx) => tx.transaction_type === 'SPEND' && tx.from_user.id === currentUser?.id)
        .reduce((sum, tx) => sum + tx.time_amount, 0),
    [transactions, currentUser?.id]
  )

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />

      <Box maxW="1000px" mx="auto" px={4} py={6}>
        {/* Header */}
        <VStack align="flex-start" spacing={1} mb={6}>
          <Heading size="md">Time Bank</Heading>
          <Text fontSize="sm" color="gray.500">Track your time credits</Text>
        </VStack>

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={6}>
          <Box bg="green.50" borderRadius="lg" p={4} border="1px solid" borderColor="green.100">
            <Text fontSize="xs" color="gray.600" mb={1}>Earned</Text>
            <Text fontSize="xl" fontWeight="700" color="green.600">+{totalEarned}H</Text>
          </Box>
          <Box bg="red.50" borderRadius="lg" p={4} border="1px solid" borderColor="red.100">
            <Text fontSize="xs" color="gray.600" mb={1}>Spent</Text>
            <Text fontSize="xl" fontWeight="700" color="red.500">-{totalSpent}H</Text>
          </Box>
          <Box bg="yellow.50" borderRadius="lg" p={4} border="1px solid" borderColor="yellow.200">
            <Text fontSize="xs" color="gray.600" mb={1}>Balance</Text>
            <Text fontSize="xl" fontWeight="700" color="yellow.600">{totalEarned - totalSpent}H</Text>
          </Box>
        </SimpleGrid>

        {/* Transactions List */}
        <Text fontWeight="600" fontSize="sm" mb={3}>Transactions</Text>
        
        {isLoading ? (
          <Text fontSize="sm" color="gray.500">Loading...</Text>
        ) : transactions.length === 0 ? (
          <Box bg="gray.50" borderRadius="lg" p={6} textAlign="center">
            <Text color="gray.500" fontSize="sm">No transactions yet</Text>
          </Box>
        ) : (
          <VStack spacing={2} align="stretch">
            {transactions.map((tx) => {
              const isEarn = tx.transaction_type === 'EARN' && tx.to_user.id === currentUser?.id
              const otherUser = tx.from_user.id === currentUser?.id ? tx.to_user : tx.from_user
              const relatedRatings = tx.ratings || []

              return (
                <Box
                  key={tx.id}
                  p={3}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.100"
                  _hover={{ bg: 'gray.50' }}
                  transition="background 0.15s"
                >
                  <Flex justify="space-between" align="flex-start">
                    <HStack spacing={3}>
                      <UserAvatar size="sm" user={otherUser} />
                      <Box>
                        <Text fontSize="sm" fontWeight="500">
                          {otherUser?.first_name} {otherUser?.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {tx.description}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {formatDate(tx.created_at)}
                        </Text>
                      </Box>
                    </HStack>
                    <HStack spacing={2}>
                      <Badge
                        colorScheme={isEarn ? 'green' : 'red'}
                        px={2}
                        py={0.5}
                        borderRadius="md"
                        fontSize="xs"
                      >
                        {isEarn ? '+' : '-'}{tx.time_amount}H
                      </Badge>
                      <Icon
                        as={isEarn ? MdArrowDownward : MdArrowUpward}
                        color={isEarn ? 'green.500' : 'red.500'}
                        boxSize={4}
                      />
                    </HStack>
                  </Flex>

                  {relatedRatings.length > 0 && (
                    <Box mt={3} pt={2} borderTop="1px solid" borderColor="gray.100">
                      <HStack spacing={1} mb={1}>
                        <Icon as={MdStar} color="yellow.400" boxSize={3} />
                        <Text fontSize="xs" fontWeight="500">Rating</Text>
                      </HStack>
                      {relatedRatings.map((rating: any, idx: number) => (
                        <HStack key={idx} fontSize="xs" color="gray.600" spacing={3}>
                          <Text>Communication: {rating.communication}/5</Text>
                          <Text>Punctuality: {rating.punctuality}/5</Text>
                        </HStack>
                      ))}
                    </Box>
                  )}
                </Box>
              )
            })}
          </VStack>
        )}
      </Box>
    </Box>
  )
}

export default TransactionsPage
