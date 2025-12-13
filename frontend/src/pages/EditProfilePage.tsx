import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Icon,
  IconButton,
  Input,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdCameraAlt, MdAdd } from "react-icons/md";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/store/useAuthStore";
import { profileService, UpdateProfileData } from "@/services/profile.service";
import { TimeBank, User } from "@/types";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuthStore();
  const currentUser = user as unknown as User;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [, setTimebank] = useState<TimeBank | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const [profileData, timebankData] = await profileService.getUserProfile();
        setTimebank(timebankData);
        setFirstName(currentUser.first_name || "");
        setLastName(currentUser.last_name || "");
        setBio(profileData.bio || "");
        setLocation(profileData.location || "");
        setPhoneNumber(profileData.phone_number || "");
        setSkills(profileData.skills || []);
        setAvatarPreview((profileData as any).avatar || null);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({ title: "Error", description: "Failed to load profile", status: "error", duration: 2000 });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser.first_name, currentUser.last_name, toast]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "Max 5MB", status: "error", duration: 2000 });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: UpdateProfileData = {
        first_name: firstName,
        last_name: lastName,
        bio,
        location,
        phone_number: phoneNumber,
        skills,
      };

      if (avatarFile) updateData.avatar = avatarFile;

      const response = await profileService.updateProfile(updateData);

      if (setUser && response.user) {
        setUser({
          ...currentUser,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          profile: { ...currentUser.profile, ...response.user_profile },
        } as any);
      }

      toast({ title: "Saved!", status: "success", duration: 2000 });
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "Failed to save", status: "error", duration: 2000 });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Box maxW="600px" mx="auto" px={4} py={6}>
          <Text fontSize="sm" color="gray.500">Loading...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />

      <Box maxW="600px" mx="auto" px={4} py={6}>
        {/* Header */}
        <Flex align="center" gap={3} mb={6}>
          <Box
            as="button"
            onClick={() => navigate("/profile")}
            p={2}
            borderRadius="md"
            _hover={{ bg: 'gray.50' }}
          >
            <Icon as={MdArrowBack} boxSize={5} color="gray.600" />
          </Box>
          <Text fontWeight="600" fontSize="lg">Edit Profile</Text>
        </Flex>

        <VStack spacing={5} align="stretch">
          {/* Avatar */}
          <Flex justify="center">
            <Box position="relative">
              <Avatar
                size="xl"
                name={`${firstName} ${lastName}`}
                src={avatarPreview || undefined}
              />
              <IconButton
                aria-label="Change photo"
                icon={<MdCameraAlt />}
                size="xs"
                colorScheme="yellow"
                borderRadius="full"
                position="absolute"
                bottom={0}
                right={0}
                onClick={handleAvatarClick}
              />
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </Box>
          </Flex>

          {/* Name */}
          <Grid templateColumns="1fr 1fr" gap={3}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500">First Name</FormLabel>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                size="sm"
                borderRadius="md"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500">Last Name</FormLabel>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                size="sm"
                borderRadius="md"
              />
            </FormControl>
          </Grid>

          {/* Location & Phone */}
          <Grid templateColumns="1fr 1fr" gap={3}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500">Location</FormLabel>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                size="sm"
                borderRadius="md"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500">Phone</FormLabel>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 555 123 4567"
                size="sm"
                borderRadius="md"
              />
            </FormControl>
          </Grid>

          {/* Bio */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="500">Bio</FormLabel>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              size="sm"
              borderRadius="md"
              rows={3}
            />
          </FormControl>

          {/* Skills */}
          <Box>
            <Text fontSize="sm" fontWeight="500" mb={2}>Skills & Interests</Text>
            <HStack mb={2}>
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                placeholder="Add skill..."
                size="sm"
                borderRadius="md"
              />
              <IconButton
                aria-label="Add"
                icon={<MdAdd />}
                size="sm"
                colorScheme="yellow"
                onClick={handleAddSkill}
              />
            </HStack>
            <HStack spacing={1} flexWrap="wrap" gap={1}>
              {skills.map((skill) => (
                <Tag key={skill} size="sm" borderRadius="full" colorScheme="yellow">
                  <TagLabel>{skill}</TagLabel>
                  <TagCloseButton onClick={() => setSkills(skills.filter((s) => s !== skill))} />
                </Tag>
              ))}
              {skills.length === 0 && (
                <Text color="gray.400" fontSize="xs">No skills added</Text>
              )}
            </HStack>
          </Box>

          {/* Actions */}
          <HStack spacing={3} pt={2}>
            <Button
              variant="outline"
              size="sm"
              flex={1}
              onClick={() => navigate("/profile")}
              isDisabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              colorScheme="yellow"
              size="sm"
              flex={1}
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default EditProfilePage;
