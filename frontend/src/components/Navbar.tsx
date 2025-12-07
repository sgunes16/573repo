import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { profileService } from "@/services/profile.service";
import UserAvatar from "@/components/UserAvatar";
import {

  MdChevronRight,
  MdDashboard,
  MdExitToApp,
  MdOutlineTimer,
  MdPersonOutline,
  MdStarOutline,
  MdTimeline,
} from "react-icons/md";
import { TimeBank, UserProfile } from "@/types";
import { useEffect, useState } from "react";
import { useGeoStore } from "@/store/useGeoStore";

interface NavbarProps {
  showUserInfo?: boolean;
}

const Navbar = ({ showUserInfo = false }: NavbarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(undefined);
  const [timeBank, setTimeBank] = useState<TimeBank | undefined>(undefined);

  const { setGeoLocation } = useGeoStore();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      if (navigator.geolocation) {
        fetchGeoLocation();
      }
    }
  }, [user]);

  const fetchUserProfile = async () => {
    const response = await profileService.getUserProfile();
    setUserProfile(response[0]);
    setTimeBank(response[1]);
  }

  const fetchGeoLocation = async () => {
      await navigator.geolocation.getCurrentPosition((position) => {
      setGeoLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    });
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box
      as="nav"
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.100"
      position="sticky"
      top={0}
      zIndex={100}
      h="56px"
    >
      <Flex
        h="100%"
        justify="space-between"
        align="center"
        px={4}
      >
        {/* Logo */}
        <HStack
          spacing={2}
          cursor="pointer"
          onClick={() => navigate(showUserInfo ? "/dashboard" : "/")}
        >
          <Box
            w="36px"
            h="36px"
            borderRadius="10px"
            overflow="hidden"
          >
            <Image
              src="/hive-logo.png"
              alt="The Hive"
              objectFit="cover"
              w="36px"
              h="36px"
            />
          </Box>
          <Text
            fontSize="lg"
            fontFamily="Urbanist, sans-serif"
            fontWeight="600"
          >
            The Hive
          </Text>
        </HStack>

        {showUserInfo && user && (
          <HStack spacing={3}>
            {/* Time Credits */}
            <HStack
              spacing={1}
              bg="yellow.50"
              px={3}
              py={1.5}
              borderRadius="full"
              border="1px solid"
              borderColor="yellow.200"
            >
              <Icon as={MdOutlineTimer} color="yellow.600" boxSize={4} />
              <Text fontSize="sm" fontWeight="600" color="yellow.700">
                {timeBank?.amount || 0}H
              </Text>
            </HStack>

            {/* User Menu */}
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                size="sm"
                px={2}
                rightIcon={<Icon as={MdChevronRight} boxSize={4} />}
              >
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="500">
                    {user.first_name}
                  </Text>
                  <Box position="relative">
                    <UserAvatar
                      user={{ ...user, profile: userProfile }}
                      size="sm"
                    />
                    <Box
                      position="absolute"
                      bottom={0}
                      right={0}
                      bg="green.400"
                      borderRadius="full"
                      w="8px"
                      h="8px"
                      border="1.5px solid white"
                    />
                  </Box>
                </HStack>
              </MenuButton>
              <MenuList fontSize="sm">
                <MenuItem onClick={() => navigate("/dashboard")}>
                  <HStack spacing={2}>
                    <Icon as={MdDashboard} boxSize={4} />
                    <Text>Dashboard</Text>
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => navigate("/profile")}>
                  <HStack spacing={2}>
                    <Icon as={MdPersonOutline} boxSize={4} />
                    <Text>My Profile</Text>
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => navigate("/transactions")}>
                  <HStack spacing={2}>
                    <Icon as={MdTimeline} boxSize={4} />
                    <Text>Transactions</Text>
                  </HStack>
                </MenuItem>
                <MenuItem onClick={handleLogout} color="red.500">
                  <HStack spacing={2}>
                    <Icon as={MdExitToApp} boxSize={4} />
                    <Text>Logout</Text>
                  </HStack>
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        )}
      </Flex>
    </Box>
  );
};

export default Navbar;
