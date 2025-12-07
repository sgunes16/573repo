import {
  Avatar,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  Stack,
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
import { UserProfile, TimeBank, User } from "@/types";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuthStore();
  const currentUser = user as unknown as User;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [, setTimebank] = useState<TimeBank | null>(null);

  // Form state
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
        setProfile(profileData);
        setTimebank(timebankData);

        // Initialize form with existing data
        setFirstName(currentUser.first_name || "");
        setLastName(currentUser.last_name || "");
        setBio(profileData.bio || "");
        setLocation(profileData.location || "");
        setPhoneNumber(profileData.phone_number || "");
        setSkills(profileData.skills || []);
        setAvatarPreview((profileData as any).avatar || null);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          status: "error",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser.first_name, currentUser.last_name, toast]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          status: "error",
          duration: 3000,
        });
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

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
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

      if (avatarFile) {
        updateData.avatar = avatarFile;
      }

      const response = await profileService.updateProfile(updateData);

      // Update auth store with new user data
      if (setUser && response.user) {
        setUser({
          ...currentUser,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          profile: {
            ...currentUser.profile,
            ...response.user_profile,
          },
        } as any);
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
        status: "success",
        duration: 3000,
      });

      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Container maxW="800px" px={{ base: 4, md: 8 }} py={10}>
          <Text>Loading...</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />

      <Container maxW="800px" px={{ base: 4, md: 8 }} py={10}>
        <Stack spacing={8}>
          {/* Header */}
          <HStack spacing={4}>
            <IconButton
              aria-label="Back"
              icon={<MdArrowBack />}
              variant="ghost"
              onClick={() => navigate("/profile")}
            />
            <Heading size="lg">Edit Profile</Heading>
          </HStack>

          {/* Avatar Section */}
          <Box
            bg="#F7FAFC"
            borderRadius="2xl"
            p={6}
            border="1px solid #E2E8F0"
          >
            <VStack spacing={4}>
              <Box position="relative">
                <Avatar
                  size="2xl"
                  name={`${firstName} ${lastName}`}
                  src={avatarPreview || undefined}
                />
                <IconButton
                  aria-label="Change photo"
                  icon={<MdCameraAlt />}
                  size="sm"
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
              <Text fontSize="sm" color="gray.500">
                Click to change profile photo
              </Text>
            </VStack>
          </Box>

          {/* Personal Info */}
          <Box
            bg="#F7FAFC"
            borderRadius="2xl"
            p={6}
            border="1px solid #E2E8F0"
          >
            <Heading size="md" mb={4}>
              Personal Information
            </Heading>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <FormControl>
                <FormLabel>First Name</FormLabel>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  bg="white"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Last Name</FormLabel>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                  bg="white"
                />
              </FormControl>
              <FormControl gridColumn={{ md: "span 2" }}>
                <FormLabel>Location</FormLabel>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, District"
                  bg="white"
                />
              </FormControl>
              <FormControl gridColumn={{ md: "span 2" }}>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 555 123 4567"
                  bg="white"
                />
              </FormControl>
            </Grid>
          </Box>

          {/* About */}
          <Box
            bg="#F7FAFC"
            borderRadius="2xl"
            p={6}
            border="1px solid #E2E8F0"
          >
            <Heading size="md" mb={4}>
              About
            </Heading>
            <FormControl>
              <FormLabel>Bio</FormLabel>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself... What are your interests? What would you like to share?"
                bg="white"
                rows={4}
                resize="vertical"
              />
            </FormControl>
          </Box>

          {/* Skills & Interests */}
          <Box
            bg="#F7FAFC"
            borderRadius="2xl"
            p={6}
            border="1px solid #E2E8F0"
          >
            <Heading size="md" mb={4}>
              Skills & Interests
            </Heading>
            <FormControl mb={4}>
              <FormLabel>Add New Skill</FormLabel>
              <HStack>
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="E.g. Coding, Cooking, Music..."
                  bg="white"
                />
                <IconButton
                  aria-label="Add"
                  icon={<MdAdd />}
                  colorScheme="yellow"
                  onClick={handleAddSkill}
                />
              </HStack>
            </FormControl>
            <HStack spacing={2} flexWrap="wrap" gap={2}>
              {skills.map((skill) => (
                <Tag
                  key={skill}
                  size="lg"
                  borderRadius="full"
                  variant="solid"
                  colorScheme="yellow"
                >
                  <TagLabel>{skill}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveSkill(skill)} />
                </Tag>
              ))}
              {skills.length === 0 && (
                <Text color="gray.400" fontSize="sm">
                  No skills added yet
                </Text>
              )}
            </HStack>
          </Box>

          {/* Action Buttons */}
          <HStack spacing={4} justify="flex-end">
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              isDisabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              colorScheme="yellow"
              onClick={handleSave}
              isLoading={isSaving}
              loadingText="Saving..."
            >
              Save
            </Button>
          </HStack>
        </Stack>
      </Container>
    </Box>
  );
};

export default EditProfilePage;
