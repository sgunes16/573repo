import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  IconButton,
  Tooltip,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { profileService } from "@/services/profile.service";
import { authService } from "@/services/auth.service";
import UserAvatar from "@/components/UserAvatar";
import {
  MdChevronRight,
  MdDashboard,
  MdExitToApp,
  MdOutlineTimer,
  MdPersonOutline,
  MdTimeline,
  MdAdminPanelSettings,
  MdNotifications,
  MdWarning,
  MdEmail,
  MdForum,
} from "react-icons/md";
import { TimeBank, UserProfile } from "@/types";
import { useEffect, useState } from "react";
import { useGeoStore } from "@/store/useGeoStore";
import { notificationService } from "@/services/notification.service";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getAccessToken } from "@/utils/cookies";
import { Badge } from "@chakra-ui/react";

interface NavbarProps {
  showUserInfo?: boolean;
}

const Navbar = ({ showUserInfo = false }: NavbarProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(undefined);
  const [timeBank, setTimeBank] = useState<TimeBank | undefined>(undefined);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const { setGeoLocation } = useGeoStore();

  const handleResendVerification = async () => {
    if (!user?.email || isResendingEmail) return;
    
    setIsResendingEmail(true);
    try {
      await authService.resendVerificationEmail(user.email);
      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox and spam folder.',
        status: 'success',
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send email',
        description: error.response?.data?.error || 'Please try again later.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchNotificationCount();
      if (navigator.geolocation) {
        fetchGeoLocation();
      }
    }
  }, [user]);

  // WebSocket for real-time notifications
  useWebSocket({
    url: '/ws/notifications/',
    token: user ? getAccessToken() || undefined : undefined,
    onMessage: (message) => {
      if (message.type === 'notification') {
        // New notification received, increment count
        setNotificationCount((prev) => prev + 1);
        // Optionally refetch notifications if on notifications page
        if (window.location.pathname === '/notifications') {
          fetchNotificationCount();
        }
      }
    },
    onOpen: () => {},
    onClose: () => {},
    reconnect: true,
  });

  const fetchNotificationCount = async () => {
    try {
      const notifications = await notificationService.getUnreadNotifications();
      setNotificationCount(notifications.length);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

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

  const isUnverified = user && !user.is_verified;
  const isBanned = user && user.is_banned;

  return (
    <>
    <Box
      as="nav"
      bg="white"
      position="sticky"
      top={0}
      zIndex={100}
      h="56px"
      boxShadow="0 1px 3px rgba(0,0,0,0.05)"
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

        {/* Anonymous User - Show Login/Signup */}
        {showUserInfo && !user && (
          <HStack spacing={3}>
            <Button
              variant="ghost"
              size="sm"
              color="gray.600"
              fontWeight="500"
              onClick={() => navigate("/login")}
              _hover={{ bg: 'gray.50' }}
            >
              Login
            </Button>
            <Button
              size="sm"
              bg="#ECC94B"
              color="black"
              fontWeight="500"
              onClick={() => navigate("/signup")}
              _hover={{ bg: '#D69E2E' }}
            >
              Sign Up
            </Button>
          </HStack>
        )}

        {/* Authenticated User */}
        {showUserInfo && user && (
          <HStack spacing={3}>
            {/* Notifications */}
            <Box position="relative">
              <IconButton
                aria-label="Notifications"
                icon={<MdNotifications />}
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate("/notifications");
                  fetchNotificationCount();
                }}
                color="gray.600"
                _hover={{ bg: 'gray.50', color: 'yellow.600' }}
              />
              {notificationCount > 0 && (
                <Badge
                  position="absolute"
                  top="-1"
                  right="-1"
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  fontSize="xs"
                  minW="18px"
                  h="18px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  px={1}
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Badge>
              )}
            </Box>
            
            {/* Time Credits */}
            <Tooltip
              label={
                <VStack spacing={1} py={1} align="stretch">
                  <HStack justify="space-between" spacing={4}>
                    <Text fontSize="xs" color="gray.300">Available:</Text>
                    <Text fontSize="xs" fontWeight="600" color="green.300">{timeBank?.available_amount || 0}H</Text>
                  </HStack>
                  <HStack justify="space-between" spacing={4}>
                    <Text fontSize="xs" color="gray.300">Blocked:</Text>
                    <Text fontSize="xs" fontWeight="600" color="orange.300">{timeBank?.blocked_amount || 0}H</Text>
                  </HStack>
                </VStack>
              }
              placement="bottom"
              hasArrow
              bg="gray.800"
              borderRadius="md"
              px={3}
              py={2}
            >
              <HStack
                spacing={1}
                bg="yellow.50"
                px={3}
                py={1.5}
                borderRadius="full"
                border="1px solid"
                borderColor="yellow.200"
                cursor="pointer"
                onClick={() => navigate("/transactions")}
                _hover={{ bg: 'yellow.100' }}
                transition="background 0.15s"
              >
                <Icon as={MdOutlineTimer} color="yellow.600" boxSize={4} />
                <Text fontSize="sm" fontWeight="600" color="yellow.700">
                  {timeBank?.amount || 0}H
                </Text>
              </HStack>
            </Tooltip>

            {/* User Menu */}
            <Menu>
              <MenuButton
                px={2}
                py={1}
                borderRadius="md"
                transition="background 0.15s"
                _hover={{ bg: 'gray.50' }}
              >
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="500" color="gray.700">
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
                  <Icon as={MdChevronRight} boxSize={4} color="gray.400" />
                </HStack>
              </MenuButton>
              <MenuList fontSize="sm" py={1} boxShadow="lg" borderColor="gray.100">
                <MenuItem onClick={() => navigate("/dashboard")} _hover={{ bg: 'gray.50' }}>
                  <HStack spacing={2}>
                    <Icon as={MdDashboard} boxSize={4} color="gray.500" />
                    <Text>Dashboard</Text>
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => navigate("/profile")} _hover={{ bg: 'gray.50' }}>
                  <HStack spacing={2}>
                    <Icon as={MdPersonOutline} boxSize={4} color="gray.500" />
                    <Text>My Profile</Text>
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => navigate("/transactions")} _hover={{ bg: 'gray.50' }}>
                  <HStack spacing={2}>
                    <Icon as={MdTimeline} boxSize={4} color="gray.500" />
                    <Text>Transactions</Text>
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => navigate("/notifications")} _hover={{ bg: 'gray.50' }}>
                  <HStack spacing={2}>
                    <Icon as={MdNotifications} boxSize={4} color="gray.500" />
                    <Text>Notifications</Text>
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => navigate("/forum")} _hover={{ bg: 'gray.50' }}>
                  <HStack spacing={2}>
                    <Icon as={MdForum} boxSize={4} color="gray.500" />
                    <Text>Forum</Text>
                  </HStack>
                </MenuItem>
                {user?.is_admin && (
                  <MenuItem onClick={() => navigate("/admin")} _hover={{ bg: 'purple.50' }}>
                    <HStack spacing={2}>
                      <Icon as={MdAdminPanelSettings} boxSize={4} color="purple.500" />
                      <Text fontWeight="500" color="purple.600">Admin Panel</Text>
                    </HStack>
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout} color="red.500" _hover={{ bg: 'red.50' }}>
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

    {/* Banned User Banner - Red, more prominent */}
    {isBanned && (
      <Box
        bg="red.500"
        position="sticky"
        top="56px"
        zIndex={99}
        py={2}
        px={4}
      >
        <Flex 
          justify="center" 
          align="center" 
          gap={3}
          maxW="container.xl"
          mx="auto"
        >
          <Icon as={MdWarning} color="white" boxSize={4} />
          <Text fontSize="sm" fontWeight="600" color="white">
            ⚠️ Your account has been suspended. You can view content but cannot create offers, start exchanges, or interact with other users.
          </Text>
        </Flex>
      </Box>
    )}

    {/* Unverified Email Banner - Only show if not banned */}
    {isUnverified && !isBanned && (
      <Box
        bg="yellow.400"
        position="sticky"
        top={isBanned ? "96px" : "56px"}
        zIndex={99}
        py={2}
        px={4}
      >
        <Flex 
          justify="center" 
          align="center" 
          gap={3}
          maxW="container.xl"
          mx="auto"
        >
          <Icon as={MdWarning} color="yellow.900" boxSize={4} />
          <Text fontSize="sm" fontWeight="500" color="yellow.900">
            Please verify your email to start handshakes and create offers.
          </Text>
          <Button
            size="xs"
            leftIcon={<Icon as={MdEmail} boxSize={3} />}
            bg="yellow.900"
            color="yellow.50"
            _hover={{ bg: 'yellow.800' }}
            onClick={handleResendVerification}
            isLoading={isResendingEmail}
            loadingText="Sending..."
          >
            Resend Verification Email
          </Button>
        </Flex>
      </Box>
    )}
    </>
  );
};

export default Navbar;
