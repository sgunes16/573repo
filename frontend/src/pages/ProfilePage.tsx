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
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAccessTime,
  MdAdd,
  MdCalendarToday,
  MdEdit,
  MdLocationOn,
  MdPeople,
  MdRepeat,
} from "react-icons/md";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/store/useAuthStore";

import { Offer, User, UserProfile, TimeBank } from "@/types";
import { offerService } from "@/services/offer.service";
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

const OfferCard = ({
  title,
  location,
  date,
  cadence,
  duration,
  group,
}: {
  title: string;
  location: string;
  date: string;
  cadence: string;
  duration: string;
  group: string;
}) => (
  <Box bg="#F7FAFC" borderRadius="xl" p={5} border="1px solid #E2E8F0">
    <Stack spacing={2}>
      <HStack justify="space-between">
        <Text fontWeight="600">{title}</Text>
        <Badge colorScheme="green" variant="subtle">
          Active
        </Badge>
      </HStack>
      <HStack color="gray.600" fontSize="sm">
        <Icon as={MdLocationOn} />
        <Text>{location}</Text>
      </HStack>
      <Divider />
      <SimpleGrid columns={2} gap={3} fontSize="sm" color="gray.700">
        <HStack>
          <Icon as={MdCalendarToday} />
          <Text>{date}</Text>
        </HStack>
        <HStack>
          <Icon as={MdRepeat} />
          <Text>{cadence}</Text>
        </HStack>
        <HStack>
          <Icon as={MdAccessTime} />
          <Text>{duration}</Text>
        </HStack>
        <HStack>
          <Icon as={MdPeople} />
          <Text>{group}</Text>
        </HStack>
      </SimpleGrid>
    </Stack>
  </Box>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUser = user as unknown as User;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [timebank, setTimebank] = useState<TimeBank | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile and timebank data
        const [profileData, timebankData] = await profileService.getUserProfile();
        setProfile(profileData);
        setTimebank(timebankData);
        
        // Fetch user's offers
        const allOffers = await offerService.getOffers();
        const filteredOffers = allOffers.filter((offer) => offer.user_id === currentUser.id);
        setOffers(filteredOffers);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser.id]);

  const completedCount = offers.filter(o => 
    String(o.status).toUpperCase() === 'COMPLETED'
  ).length;

  const stats = [
    {
      label: "Time Credits",
      value: `${timebank?.amount ?? profile?.time_credits ?? 0}H`,
    },
    { label: "Rating", value: `${profile?.rating ?? 0} ★` },
    { label: "Completed Exchanges", value: String(completedCount) },
  ];

  const skillTags = profile?.skills ?? [];

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
                    name={`${currentUser.first_name} ${currentUser.last_name}`}
                    src={(profile as any)?.avatar || currentUser.profile?.profile_picture}
                  />
                  <VStack spacing={1}>
                    <Heading size="md">{`${currentUser.first_name} ${currentUser.last_name}`}</Heading>
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
                  <SimpleGrid columns={3} w="full">
                    {stats.map((stat) => (
                      <StatPill key={stat.label} {...stat} />
                    ))}
                  </SimpleGrid>
                  <Button
                    leftIcon={<MdEdit />}
                    variant="outline"
                    colorScheme="yellow"
                    onClick={() => navigate("/profile/edit")}
                    alignSelf="stretch"
                  >
                    Edit Profile
                  </Button>
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
                  {skillTags.length > 0 ? (
                    skillTags.map((tag) => (
                      <Tag key={tag} size="md" borderRadius="full" bg="#E2E8F0">
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

            <Stack spacing={6}>
              <Box>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">My Offers</Heading>
                  <Button
                    leftIcon={<MdAdd />}
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/create-offer")}
                  >
                    New Offer
                  </Button>
                </HStack>
                {offers.length ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {offers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        title={offer.title}
                        location={offer.location ?? ''}
                        date={new Date(offer.created_at).toLocaleDateString()}
                        cadence="Weekly"
                        duration={`${offer.time_required} min`}
                        group="1 to 1"
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Box bg="#F7FAFC" borderRadius="xl" p={6} textAlign="center">
                    <Text color="gray.600">
                      No offers yet. Start by creating your first offer.
                    </Text>
                  </Box>
                )}
              </Box>

              <Box>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">My Wants</Heading>
                  <Button
                    leftIcon={<MdAdd />}
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/wants")}
                  >
                    New Want
                  </Button>
                </HStack>
                {/**wants.length ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {wants.map((want) => (
                      <OfferCard
                        key={want.id}
                        title={want.title}
                        location={want.location ?? '' }
                        date={new Date(want.created_at).toLocaleDateString()}
                        cadence="One-time"
                        duration={`${want.time_offered} min`}
                        group="Flexible"
                      />
                    ))}
                  </SimpleGrid>
                ) : (*/
                  <Box bg="#F7FAFC" borderRadius="xl" p={6} textAlign="center">
                    <Text color="gray.600">
                      No active wants. Post your next request.
                    </Text>
                  </Box>
                /*)*/}
              </Box>

              <Box
                bg="#F7FAFC"
                borderRadius="2xl"
                p={6}
                border="1px solid #E2E8F0"
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
                  View Transactions
                </Button>
              </Box>
            </Stack>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
};

export default ProfilePage;
