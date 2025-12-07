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
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MdAccessTime,
  MdAdd,
  MdEdit,
  MdLocationOn,
  MdStar,
} from "react-icons/md";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/store/useAuthStore";

import { User, UserProfile, TimeBank, TimeBankTransaction, Comment } from "@/types";
import { profileService } from "@/services/profile.service";


const StatPill = ({ label, value }: { label: string; value: string }) => (
  <VStack spacing={0} align="flex-start">
    <Text fontSize="xs" color="gray.500">
      {label}
    </Text>
    <Text fontSize="lg" fontWeight="600">
      {value}
    </Text>
  </VStack>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuthStore();
  const currentUser = user as unknown as User;
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [wants, setWants] = useState<any[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [timebank, setTimebank] = useState<TimeBank | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TimeBankTransaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ratingsSummary, setRatingsSummary] = useState<{
    avg_communication: number
    avg_punctuality: number
    total_count: number
    would_recommend_percentage: number
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  // Categorize offers by status
  const activeOffers = offers.filter((o: any) => o.status === 'active')
  const inProgressOffers = offers.filter((o: any) => o.status === 'in_progress')
  const completedOffers = offers.filter((o: any) => o.status === 'completed')
  
  // Categorize wants by status
  const activeWants = wants.filter((w: any) => w.status === 'active')
  const inProgressWants = wants.filter((w: any) => w.status === 'in_progress')
  const completedWants = wants.filter((w: any) => w.status === 'completed')

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isOwnProfile) {
          // Fetch own profile using detail endpoint to get status information
          const [profileData, timebankData] = await profileService.getUserProfile();
          setProfile(profileData);
          setTimebank(timebankData);
          setViewingUser(currentUser);
          
          // Fetch own profile detail to get offers with status
          const profileDetail = await profileService.getUserProfileDetail(currentUser.id);
          setOffers(profileDetail.recent_offers);
          setWants(profileDetail.recent_wants);
          setRecentTransactions(profileDetail.recent_transactions);
          setComments(profileDetail.comments || []);
          setRatingsSummary(profileDetail.ratings_summary || null);
        } else {
          // Fetch other user's profile
          const profileDetail = await profileService.getUserProfileDetail(userId);
          setProfile(profileDetail.profile);
          setViewingUser({
            id: profileDetail.user.id,
            email: profileDetail.user.email,
            first_name: profileDetail.user.first_name,
            last_name: profileDetail.user.last_name,
          } as User);
          setOffers(profileDetail.recent_offers);
          setWants(profileDetail.recent_wants);
          setRecentTransactions(profileDetail.recent_transactions);
          setComments(profileDetail.comments || []);
          setRatingsSummary(profileDetail.ratings_summary || null);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId, currentUser?.id, isOwnProfile]);

  const completedCount = offers.filter(o => 
    String(o.status).toUpperCase() === 'COMPLETED'
  ).length;

  const stats = isOwnProfile ? [
    {
      label: "Time Credits",
      value: `${timebank?.amount ?? profile?.time_credits ?? 0}H`,
    },
    { label: "Rating", value: `${profile?.rating ?? 0} ★` },
    { label: "Completed Exchanges", value: String(completedCount) },
  ] : [
    { label: "Rating", value: `${profile?.rating ?? 0} ★` },
    { label: "Completed Exchanges", value: String(completedCount) },
  ];

  if (isLoading) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Container maxW="1440px" px={{ base: 4, md: 8 }} py={10}>
          <Grid templateColumns={{ base: "1fr", lg: "360px 1fr" }} gap={6}>
            <VStack spacing={6} align="stretch">
              <Box bg="#F7FAFC" borderRadius="2xl" p={6} border="1px solid #E2E8F0">
                <Stack spacing={4} align="center">
                  <SkeletonCircle size="96px" />
                  <Skeleton height="24px" width="150px" />
                  <Skeleton height="16px" width="100px" />
                  <Skeleton height="32px" width="full" />
                </Stack>
              </Box>
              <Box bg="#F7FAFC" borderRadius="2xl" p={6} border="1px solid #E2E8F0">
                <SkeletonText noOfLines={4} spacing="4" />
              </Box>
            </VStack>
            <Stack spacing={6}>
              <Skeleton height="200px" borderRadius="xl" />
              <Skeleton height="200px" borderRadius="xl" />
            </Stack>
          </Grid>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />

      <Container maxW="1440px" px={{ base: 4, md: 8 }} py={10}>
        <Stack spacing={8}>
          <Grid
            templateColumns={{ base: "1fr", lg: "360px 1fr" }}
            gap={6}
            alignItems="start"
          >
            <VStack spacing={6} align="stretch">
              <Box
                bg="#F7FAFC"
                borderRadius="2xl"
                p={6}
                border="1px solid #E2E8F0"
              >
                <Stack spacing={4} align="center">
                  <Avatar
                    size="xl"
                    name={`${viewingUser?.first_name || ''} ${viewingUser?.last_name || ''}`}
                    src={(profile as any)?.avatar}
                  />
                  <VStack spacing={1}>
                    <Heading size="md">{`${viewingUser?.first_name || ''} ${viewingUser?.last_name || ''}`}</Heading>
                    <Text color="gray.600">
                      {profile?.location || "Location not specified"}
                    </Text>
                  </VStack>
                  <HStack spacing={2}>
                    {(profile as any)?.badges?.length > 0 ? (
                      (profile as any).badges.map((badge: string, index: number) => (
                        <Badge key={index} colorScheme="purple" variant="subtle">
                          {badge}
                        </Badge>
                      ))
                    ) : (
                      <Badge colorScheme="purple" variant="subtle">
                        Member
                      </Badge>
                    )}
                  </HStack>
                  <SimpleGrid columns={isOwnProfile ? 3 : 2} w="full">
                    {stats.map((stat) => (
                      <StatPill key={stat.label} {...stat} />
                    ))}
                  </SimpleGrid>
                  {ratingsSummary && ratingsSummary.total_count > 0 && (
                    <Box w="full" mt={4} pt={4} borderTop="1px solid #E2E8F0">
                      <Heading size="sm" mb={3}>
                        Rating Details ({ratingsSummary.total_count} {ratingsSummary.total_count === 1 ? 'rating' : 'ratings'})
                      </Heading>
                      <VStack align="flex-start" spacing={3}>
                        <Box w="full">
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm" color="gray.600">
                              Communication
                            </Text>
                            <Text fontSize="sm" fontWeight="600">
                              {ratingsSummary.avg_communication}/5
                            </Text>
                          </HStack>
                          <HStack spacing={1}>
                            {[...Array(5)].map((_, idx) => (
                              <Icon
                                key={idx}
                                as={MdStar}
                                color={idx < Math.round(ratingsSummary.avg_communication) ? 'yellow.400' : 'gray.300'}
                                boxSize={4}
                              />
                            ))}
                          </HStack>
                        </Box>
                        <Box w="full">
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm" color="gray.600">
                              Punctuality
                            </Text>
                            <Text fontSize="sm" fontWeight="600">
                              {ratingsSummary.avg_punctuality}/5
                            </Text>
                          </HStack>
                          <HStack spacing={1}>
                            {[...Array(5)].map((_, idx) => (
                              <Icon
                                key={idx}
                                as={MdStar}
                                color={idx < Math.round(ratingsSummary.avg_punctuality) ? 'yellow.400' : 'gray.300'}
                                boxSize={4}
                              />
                            ))}
                          </HStack>
                        </Box>
                        <Box w="full">
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">
                              Would Recommend
                            </Text>
                            <Text fontSize="sm" fontWeight="600" color="green.500">
                              {ratingsSummary.would_recommend_percentage}%
                            </Text>
                          </HStack>
                        </Box>
                      </VStack>
                    </Box>
                  )}
                  {isOwnProfile && (
                    <Button
                      leftIcon={<MdEdit />}
                      variant="outline"
                      colorScheme="yellow"
                      onClick={() => navigate("/profile/edit")}
                      alignSelf="stretch"
                    >
                      Edit Profile
                    </Button>
                  )}
                </Stack>
              </Box>

              <Box
                bg="#F7FAFC"
                borderRadius="2xl"
                p={6}
                border="1px solid #E2E8F0"
              >
                <Heading size="sm" mb={2}>
                  About
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  {profile?.bio || "No bio added yet. Edit your profile to introduce yourself!"}
                </Text>
                <Divider my={4} />
                <Heading size="sm" mb={2}>
                  Skills & Interests
                </Heading>
                <HStack spacing={2} flexWrap="wrap" gap={2}>
                  {(profile?.skills || []).length > 0 ? (
                    (profile?.skills || []).map((tag, idx) => (
                      <Tag key={idx} size="md" borderRadius="full" bg="#E2E8F0">
                        {tag}
                      </Tag>
                    ))
                  ) : (
                    <Text color="gray.400" fontSize="sm">
                      No skills added yet
                    </Text>
                  )}
                </HStack>
              </Box>
            </VStack>

            <Box>
              <Tabs colorScheme="yellow" variant="enclosed">
                <TabList>
                  <Tab>Offers</Tab>
                  <Tab>Wants</Tab>
                  <Tab>Transactions</Tab>
                  <Tab>Comments</Tab>
                </TabList>

                <TabPanels>
                  {/* Offers Tab */}
                  <TabPanel px={0}>
                    <HStack justify="space-between" mb={4}>
                      <Heading size="md">{isOwnProfile ? 'My Offers' : 'Offers'}</Heading>
                      {isOwnProfile && (
                        <Button
                          leftIcon={<MdAdd />}
                          size="sm"
                          variant="outline"
                          onClick={() => navigate("/create-offer")}
                        >
                          New Offer
                        </Button>
                      )}
                    </HStack>
                    {isOwnProfile && (inProgressOffers.length > 0 || completedOffers.length > 0) ? (
                      <Stack spacing={6}>
                        {inProgressOffers.length > 0 && (
                          <Box>
                            <Heading size="sm" mb={3} color="blue.600">
                              In Progress ({inProgressOffers.length})
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              {inProgressOffers.map((offer: any) => (
                                <Box
                                  key={offer.id}
                                  bg="#EBF8FF"
                                  borderRadius="xl"
                                  p={5}
                                  border="2px solid #90CDF4"
                                  cursor="pointer"
                                  onClick={() => navigate(`/offer/${offer.id}`)}
                                  _hover={{ bg: '#BEE3F8' }}
                                >
                                  <Stack spacing={2}>
                                    <HStack justify="space-between">
                                      <Text fontWeight="600">{offer.title}</Text>
                                      <Badge colorScheme="blue" variant="solid">
                                        In Progress
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                      {offer.description}
                                    </Text>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdLocationOn} />
                                      <Text>{offer.location || 'Location not specified'}</Text>
                                    </HStack>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdAccessTime} />
                                      <Text>{offer.time_required} hour{offer.time_required > 1 ? 's' : ''}</Text>
                                    </HStack>
                                  </Stack>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>
                        )}
                        {completedOffers.length > 0 && (
                          <Box>
                            <Heading size="sm" mb={3} color="green.600">
                              Completed ({completedOffers.length})
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              {completedOffers.map((offer: any) => (
                                <Box
                                  key={offer.id}
                                  bg="#F0FFF4"
                                  borderRadius="xl"
                                  p={5}
                                  border="2px solid #9AE6B4"
                                  cursor="pointer"
                                  onClick={() => navigate(`/offer/${offer.id}`)}
                                  _hover={{ bg: '#C6F6D5' }}
                                >
                                  <Stack spacing={2}>
                                    <HStack justify="space-between">
                                      <Text fontWeight="600">{offer.title}</Text>
                                      <Badge colorScheme="green" variant="solid">
                                        Completed
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                      {offer.description}
                                    </Text>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdLocationOn} />
                                      <Text>{offer.location || 'Location not specified'}</Text>
                                    </HStack>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdAccessTime} />
                                      <Text>{offer.time_required} hour{offer.time_required > 1 ? 's' : ''}</Text>
                                    </HStack>
                                  </Stack>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>
                        )}
                        {activeOffers.length > 0 && (
                          <Box>
                            <Heading size="sm" mb={3}>
                              Active ({activeOffers.length})
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              {activeOffers.map((offer: any) => (
                                <Box
                                  key={offer.id}
                                  bg="#F7FAFC"
                                  borderRadius="xl"
                                  p={5}
                                  border="1px solid #E2E8F0"
                                  cursor="pointer"
                                  onClick={() => navigate(`/offer/${offer.id}`)}
                                  _hover={{ bg: '#EDF2F7' }}
                                >
                                  <Stack spacing={2}>
                                    <HStack justify="space-between">
                                      <Text fontWeight="600">{offer.title}</Text>
                                      <Badge colorScheme="green" variant="subtle">
                                        Active
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                      {offer.description}
                                    </Text>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdLocationOn} />
                                      <Text>{offer.location || 'Location not specified'}</Text>
                                    </HStack>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdAccessTime} />
                                      <Text>{offer.time_required} hour{offer.time_required > 1 ? 's' : ''}</Text>
                                    </HStack>
                                  </Stack>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>
                        )}
                      </Stack>
                    ) : offers.length > 0 ? (
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {offers.map((offer: any) => (
                          <Box
                            key={offer.id}
                            bg="#F7FAFC"
                            borderRadius="xl"
                            p={5}
                            border="1px solid #E2E8F0"
                            cursor="pointer"
                            onClick={() => navigate(`/offer/${offer.id}`)}
                            _hover={{ bg: '#EDF2F7' }}
                          >
                            <Stack spacing={2}>
                              <HStack justify="space-between">
                                <Text fontWeight="600">{offer.title}</Text>
                                <Badge colorScheme="green" variant="subtle">
                                  {offer.type === 'offer' ? 'Offer' : 'Want'}
                                </Badge>
                              </HStack>
                              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                {offer.description}
                              </Text>
                              <HStack color="gray.600" fontSize="sm">
                                <Icon as={MdLocationOn} />
                                <Text>{offer.location || 'Location not specified'}</Text>
                              </HStack>
                              <HStack color="gray.600" fontSize="sm">
                                <Icon as={MdAccessTime} />
                                <Text>{offer.time_required} hour{offer.time_required > 1 ? 's' : ''}</Text>
                              </HStack>
                            </Stack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Box bg="#F7FAFC" borderRadius="xl" p={6} textAlign="center">
                        <Text color="gray.600">
                          {isOwnProfile ? 'No offers yet. Start by creating your first offer.' : 'No offers yet.'}
                        </Text>
                      </Box>
                    )}
                  </TabPanel>

                  {/* Wants Tab */}
                  <TabPanel px={0}>
                    <HStack justify="space-between" mb={4}>
                      <Heading size="md">{isOwnProfile ? 'My Wants' : 'Wants'}</Heading>
                      {isOwnProfile && (
                        <Button
                          leftIcon={<MdAdd />}
                          size="sm"
                          variant="outline"
                          onClick={() => navigate("/wants")}
                        >
                          New Want
                        </Button>
                      )}
                    </HStack>
                    {isOwnProfile && (inProgressWants.length > 0 || completedWants.length > 0) ? (
                      <Stack spacing={6}>
                        {inProgressWants.length > 0 && (
                          <Box>
                            <Heading size="sm" mb={3} color="blue.600">
                              In Progress ({inProgressWants.length})
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              {inProgressWants.map((want: any) => (
                                <Box
                                  key={want.id}
                                  bg="#EBF8FF"
                                  borderRadius="xl"
                                  p={5}
                                  border="2px solid #90CDF4"
                                  cursor="pointer"
                                  onClick={() => navigate(`/offer/${want.id}`)}
                                  _hover={{ bg: '#BEE3F8' }}
                                >
                                  <Stack spacing={2}>
                                    <HStack justify="space-between">
                                      <Text fontWeight="600">{want.title}</Text>
                                      <Badge colorScheme="blue" variant="solid">
                                        In Progress
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                      {want.description}
                                    </Text>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdLocationOn} />
                                      <Text>{want.location || 'Location not specified'}</Text>
                                    </HStack>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdAccessTime} />
                                      <Text>{want.time_required} hour{want.time_required > 1 ? 's' : ''}</Text>
                                    </HStack>
                                  </Stack>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>
                        )}
                        {completedWants.length > 0 && (
                          <Box>
                            <Heading size="sm" mb={3} color="green.600">
                              Completed ({completedWants.length})
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              {completedWants.map((want: any) => (
                                <Box
                                  key={want.id}
                                  bg="#F0FFF4"
                                  borderRadius="xl"
                                  p={5}
                                  border="2px solid #9AE6B4"
                                  cursor="pointer"
                                  onClick={() => navigate(`/offer/${want.id}`)}
                                  _hover={{ bg: '#C6F6D5' }}
                                >
                                  <Stack spacing={2}>
                                    <HStack justify="space-between">
                                      <Text fontWeight="600">{want.title}</Text>
                                      <Badge colorScheme="green" variant="solid">
                                        Completed
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                      {want.description}
                                    </Text>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdLocationOn} />
                                      <Text>{want.location || 'Location not specified'}</Text>
                                    </HStack>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdAccessTime} />
                                      <Text>{want.time_required} hour{want.time_required > 1 ? 's' : ''}</Text>
                                    </HStack>
                                  </Stack>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>
                        )}
                        {activeWants.length > 0 && (
                          <Box>
                            <Heading size="sm" mb={3}>
                              Active ({activeWants.length})
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              {activeWants.map((want: any) => (
                                <Box
                                  key={want.id}
                                  bg="#F7FAFC"
                                  borderRadius="xl"
                                  p={5}
                                  border="1px solid #E2E8F0"
                                  cursor="pointer"
                                  onClick={() => navigate(`/offer/${want.id}`)}
                                  _hover={{ bg: '#EDF2F7' }}
                                >
                                  <Stack spacing={2}>
                                    <HStack justify="space-between">
                                      <Text fontWeight="600">{want.title}</Text>
                                      <Badge colorScheme="blue" variant="subtle">
                                        Want
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                      {want.description}
                                    </Text>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdLocationOn} />
                                      <Text>{want.location || 'Location not specified'}</Text>
                                    </HStack>
                                    <HStack color="gray.600" fontSize="sm">
                                      <Icon as={MdAccessTime} />
                                      <Text>{want.time_required} hour{want.time_required > 1 ? 's' : ''}</Text>
                                    </HStack>
                                  </Stack>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>
                        )}
                      </Stack>
                    ) : wants.length > 0 ? (
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {wants.map((want: any) => (
                          <Box
                            key={want.id}
                            bg="#F7FAFC"
                            borderRadius="xl"
                            p={5}
                            border="1px solid #E2E8F0"
                            cursor="pointer"
                            onClick={() => navigate(`/offer/${want.id}`)}
                            _hover={{ bg: '#EDF2F7' }}
                          >
                            <Stack spacing={2}>
                              <HStack justify="space-between">
                                <Text fontWeight="600">{want.title}</Text>
                                <Badge colorScheme="blue" variant="subtle">
                                  Want
                                </Badge>
                              </HStack>
                              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                {want.description}
                              </Text>
                              <HStack color="gray.600" fontSize="sm">
                                <Icon as={MdLocationOn} />
                                <Text>{want.location || 'Location not specified'}</Text>
                              </HStack>
                              <HStack color="gray.600" fontSize="sm">
                                <Icon as={MdAccessTime} />
                                <Text>{want.time_required} hour{want.time_required > 1 ? 's' : ''}</Text>
                              </HStack>
                            </Stack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Box bg="#F7FAFC" borderRadius="xl" p={6} textAlign="center">
                        <Text color="gray.600">
                          {isOwnProfile ? 'No active wants. Post your next request.' : 'No wants yet.'}
                        </Text>
                      </Box>
                    )}
                  </TabPanel>

                  {/* Transactions Tab */}
                  <TabPanel px={0}>
                    {isOwnProfile && timebank && (
                      <Box
                        bg="#F7FAFC"
                        borderRadius="2xl"
                        p={6}
                        border="1px solid #E2E8F0"
                        mb={6}
                      >
                        <Heading size="md" mb={4}>
                          Time Bank Snapshot
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                          <StatPill
                            label="Available Credits"
                            value={`${timebank?.available_amount ?? 0}H`}
                          />
                          <StatPill label="Blocked" value={`${timebank?.blocked_amount ?? 0}H`} />
                          <StatPill label="Total" value={`${timebank?.total_amount ?? 0}H`} />
                        </SimpleGrid>
                        <Button
                          variant="ghost"
                          mt={4}
                          onClick={() => navigate("/transactions")}
                          alignSelf="flex-start"
                        >
                          View All Transactions
                        </Button>
                      </Box>
                    )}
                    <Heading size="md" mb={4}>
                      Recent Transactions
                    </Heading>
                    {recentTransactions.length > 0 ? (
                      <Stack spacing={3}>
                        {recentTransactions.map((tx) => {
                          const isEarn = tx.transaction_type === 'EARN'
                          const otherUser = tx.from_user.id === viewingUser?.id ? tx.to_user : tx.from_user
                          return (
                            <Box
                              key={tx.id}
                              bg="white"
                              borderRadius="lg"
                              p={4}
                              border="1px solid #E2E8F0"
                            >
                              <HStack justify="space-between">
                                <HStack spacing={3}>
                                  <Avatar size="sm" name={`${otherUser.first_name} ${otherUser.last_name}`} />
                                  <VStack align="flex-start" spacing={0}>
                                    <Text fontSize="sm" fontWeight="600">
                                      {tx.exchange?.offer.title || tx.description}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">
                                      {otherUser.first_name} {otherUser.last_name}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {new Date(tx.created_at).toLocaleDateString()}
                                    </Text>
                                  </VStack>
                                </HStack>
                                <Badge
                                  colorScheme={isEarn ? 'green' : 'red'}
                                  px={3}
                                  py={1}
                                  borderRadius="md"
                                  fontWeight="bold"
                                >
                                  {isEarn ? '+' : '-'}
                                  {tx.time_amount}H
                                </Badge>
                              </HStack>
                            </Box>
                          )
                        })}
                      </Stack>
                    ) : (
                      <Box bg="#F7FAFC" borderRadius="xl" p={6} textAlign="center">
                        <Text color="gray.600" fontSize="sm">
                          No recent transactions.
                        </Text>
                      </Box>
                    )}
                  </TabPanel>

                  {/* Comments Tab */}
                  <TabPanel px={0}>
                    <Heading size="md" mb={4}>
                      Comments ({comments.length})
                    </Heading>
                    {comments.length > 0 ? (
                      <Stack spacing={4}>
                        {comments.map((comment) => (
                          <Box
                            key={comment.id}
                            bg="white"
                            borderRadius="lg"
                            p={5}
                            border="1px solid #E2E8F0"
                          >
                            <HStack spacing={3} mb={3}>
                              <Avatar
                                size="sm"
                                name={`${comment.user?.first_name || ''} ${comment.user?.last_name || ''}`}
                                src={(comment.user as any)?.profile?.avatar}
                                cursor="pointer"
                                onClick={() => {
                                  if (comment.user?.id) {
                                    navigate(`/profile/${comment.user.id}`)
                                  }
                                }}
                              />
                              <VStack align="flex-start" spacing={0}>
                                <Text fontSize="sm" fontWeight="600">
                                  {comment.user?.first_name} {comment.user?.last_name}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </Text>
                              </VStack>
                              {comment.rating && (
                                <HStack spacing={1} ml="auto">
                                  {[...Array(comment.rating)].map((_, idx) => (
                                    <Icon key={idx} as={MdStar} color="yellow.400" boxSize={4} />
                                  ))}
                                </HStack>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                              {comment.content}
                            </Text>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box bg="#F7FAFC" borderRadius="xl" p={6} textAlign="center">
                        <Text color="gray.600" fontSize="sm">
                          No comments yet.
                        </Text>
                      </Box>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
};

export default ProfilePage;
