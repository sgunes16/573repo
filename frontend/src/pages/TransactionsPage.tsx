import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Heading,
  HStack,
  Icon,
  Stack,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useMemo, useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { transactionService } from '@/services/transaction.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { TimeBankTransaction } from '@/types'
import { MdArrowDownward, MdArrowUpward, MdChatBubbleOutline, MdStar } from 'react-icons/md'

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('tr-TR', {
    year: 'numeric',
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

  const userFeedback = useMemo(
    () =>
      transactions
        .filter((tx) => tx.comments && tx.comments.length > 0)
        .flatMap((tx) => tx.comments || []),
    [transactions]
  )

  if (isLoading) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Container maxW="1200px" py={10} px={{ base: 4, md: 8 }}>
          <Stack spacing={10}>
            <VStack align="flex-start" spacing={2}>
              <Heading size="xl">Time Bank</Heading>
              <Text color="gray.600">Keep track of every hour you give and receive.</Text>
            </VStack>
            <Text>Loading transactions...</Text>
          </Stack>
        </Container>
      </Box>
    )
  }

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />

      <Container maxW="1200px" py={10} px={{ base: 4, md: 8 }}>
        <Stack spacing={10}>
          <VStack align="flex-start" spacing={2}>
            <Heading size="xl">Time Bank</Heading>
            <Text color="gray.600">Keep track of every hour you give and receive.</Text>
          </VStack>

          <SimpleSummary totalEarned={totalEarned} totalSpent={totalSpent} />

          <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap={6} alignItems="flex-start">
            <TransactionTimeline
              transactions={transactions}
              currentUserId={currentUser?.id}
              feedbackByExchange={userFeedback}
            />
            <FeedbackPanel recentFeedback={userFeedback} />
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}

const SimpleSummary = ({ totalEarned, totalSpent }: { totalEarned: number; totalSpent: number }) => (
  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
    <SummaryCard label="Total Earned" value={`+${totalEarned}H`} accent="green.500" />
    <SummaryCard label="Total Spent" value={`-${totalSpent}H`} accent="red.500" />
    <SummaryCard label="Balance" value={`${totalEarned - totalSpent}H`} accent="yellow.500" />
  </SimpleGrid>
)

const SummaryCard = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <Box bg="#F7FAFC" borderRadius="xl" p={5} border="1px solid #E2E8F0">
    <Text fontSize="sm" color="gray.600">
      {label}
    </Text>
    <Text fontSize="2xl" fontWeight="700" color={accent}>
      {value}
    </Text>
  </Box>
)

const TransactionTimeline = ({
  transactions,
  currentUserId,
  feedbackByExchange,
}: {
  transactions: TimeBankTransaction[]
  currentUserId?: string
  feedbackByExchange: any[]
}) => (
  <Stack spacing={4}>
    <Heading size="md">Recent Transactions</Heading>
    <VStack spacing={4} align="stretch">
      {transactions.length === 0 && (
        <Box bg="#F7FAFC" borderRadius="xl" p={6} textAlign="center">
          <Text color="gray.600">You have no transactions yet.</Text>
        </Box>
      )}
      {transactions.map((transaction) => {
        const isEarn = transaction.transaction_type === 'EARN' && transaction.to_user.id === currentUserId
        const isSpend = transaction.transaction_type === 'SPEND' && transaction.from_user.id === currentUserId
        const otherUser =
          transaction.from_user.id === currentUserId ? transaction.to_user : transaction.from_user

        const relatedComments = transaction.comments || []
        const relatedRatings = transaction.ratings || []
        return (
          <Box key={transaction.id} bg="#F7FAFC" borderRadius="xl" p={5} border="1px solid #E2E8F0">
            <HStack justify="space-between" align="flex-start">
              <HStack spacing={4} align="flex-start">
                <Avatar name={`${otherUser?.first_name} ${otherUser?.last_name}`} />
                <VStack align="flex-start" spacing={1}>
                  <Text fontWeight="600">
                    {otherUser?.first_name} {otherUser?.last_name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {transaction.description}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {formatDate(transaction.created_at)}
                  </Text>
                </VStack>
              </HStack>
              <VStack align="flex-end">
                <Badge
                  colorScheme={isEarn ? 'green' : 'red'}
                  px={3}
                  py={1}
                  borderRadius="md"
                  fontWeight="bold"
                >
                  {isEarn ? '+' : '-'}
                  {transaction.time_amount}H
                </Badge>
                <Icon
                  as={isEarn ? MdArrowDownward : MdArrowUpward}
                  color={isEarn ? 'green.500' : 'red.500'}
                />
              </VStack>
            </HStack>
            {(relatedComments.length > 0 || relatedRatings.length > 0) && (
              <Box mt={4}>
                <Divider mb={3} />
                {relatedRatings.length > 0 && (
                  <>
                    <HStack spacing={2} mb={2}>
                      <Icon as={MdStar} color="yellow.500" />
                      <Text fontWeight="600" fontSize="sm">
                        Ratings
                      </Text>
                    </HStack>
                    <VStack align="stretch" spacing={2} mb={3}>
                      {relatedRatings.map((rating: any, idx: number) => (
                        <Box key={idx} bg="white" borderRadius="md" p={3}>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm" fontWeight="600">
                              Communication: {rating.communication}/5
                            </Text>
                            <Text fontSize="sm" fontWeight="600">
                              Punctuality: {rating.punctuality}/5
                            </Text>
                          </HStack>
                          {rating.comment && (
                            <Text fontSize="sm" color="gray.700" mt={1}>
                              {rating.comment}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </>
                )}
                {relatedComments.length > 0 && (
                  <>
                    <HStack spacing={2} mb={2}>
                      <Icon as={MdChatBubbleOutline} color="gray.500" />
                      <Text fontWeight="600" fontSize="sm">
                        Comments
                      </Text>
                    </HStack>
                    <VStack align="stretch" spacing={2}>
                      {relatedComments.map((comment: any) => (
                        <Box key={comment.id} bg="white" borderRadius="md" p={3}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" fontWeight="600">
                              {comment.user.first_name} {comment.user.last_name}
                            </Text>
                            {comment.rating && (
                              <HStack spacing={0.5}>
                                {[...Array(comment.rating)].map((_, index) => (
                                  <Icon key={index} as={MdStar} color="#ECC94B" boxSize={3} />
                                ))}
                              </HStack>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="gray.700">
                            {comment.content}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </>
                )}
              </Box>
            )}
          </Box>
        )
      })}
    </VStack>
  </Stack>
)

const FeedbackPanel = ({ recentFeedback }: { recentFeedback: any[] }) => (
  <Stack spacing={4}>
    <Heading size="md">Latest Comments</Heading>
    <VStack spacing={4} align="stretch">
      {recentFeedback.map((feedback) => (
        <Box key={feedback.id} bg="#F7FAFC" borderRadius="xl" p={4} border="1px solid #E2E8F0">
          <HStack justify="space-between" mb={2}>
            <HStack spacing={2}>
              <Avatar size="sm" name={feedback.user.first_name} />
              <Text fontWeight="600">{feedback.user.first_name}</Text>
            </HStack>
            {feedback.rating && (
              <HStack spacing={0.5}>
                {[...Array(feedback.rating)].map((_, index) => (
                  <Icon key={index} as={MdStar} color="#ECC94B" boxSize={3} />
                ))}
              </HStack>
            )}
          </HStack>
          <Text fontSize="sm" color="gray.700">
            {feedback.content}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={2}>
            {new Date(feedback.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </Box>
      ))}
      <Button variant="outline" size="sm">
        See All Feedback
      </Button>
    </VStack>
  </Stack>
)

export default TransactionsPage
