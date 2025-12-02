from django.db import models

# Create your models here.

STATUS_CHOICES = [
    ('ACTIVE', 'Active'),
    ('INACTIVE', 'Inactive'),
    ('COMPLETED', 'Completed'),
    ('CANCELLED', 'Cancelled'),
]
ACTIVITY_TYPE_CHOICES = [
    ('1to1', '1 to 1'),
    ('group', 'Group'),
]
TYPE_CHOICES = [
    ('offer', 'Offer'),
    ('want', 'Want'),
]
OFFER_TYPE_CHOICES = [
    ('1time', '1 time'),
    ('recurring', 'Recurring'),
]
PERSON_COUNT_CHOICES = [
    ('1', '1'),
    ('2', '2'),
    ('3', '3'),
    ('4', '4'),
    ('5', '5'),
]
LOCATION_TYPE_CHOICES = [
    ('myLocation', 'My Location'),
    ('otherLocation', 'Remote'),
]

OFFER_TYPE = [
    ('offer', 'Offer'),
    ('want', 'Want'),
]


class User(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    is_banned = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    skills = models.JSONField(default=list)
    rating = models.FloatField(default=0.0)
    phone_number = models.CharField(max_length=20, blank=True)
    badges = models.JSONField(default=list)
    achievements = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def time_credits(self):
        try:
            return self.user.timebank.amount
        except:
            return 0

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}" if self.user.first_name else self.user.email


class Offer(models.Model):

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='offers')
    type = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default='offer')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    time_required = models.IntegerField(default=1)
    location = models.CharField(max_length=255, blank=True)
    geo_location = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    activity_type = models.CharField(
        max_length=20, choices=ACTIVITY_TYPE_CHOICES, default='1to1')
    offer_type = models.CharField(
        max_length=20, choices=OFFER_TYPE_CHOICES, default='1time')
    person_count = models.IntegerField(default=1)
    location_type = models.CharField(
        max_length=20, choices=LOCATION_TYPE_CHOICES, default='myLocation')
    tags = models.JSONField(default=list)
    images = models.JSONField(default=list)
    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    from_date = models.DateTimeField(null=True, blank=True)
    to_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def block_time(self):
        return self.user.timebank.block_credit(self.time_required)

    def release_time(self):
        self.user.timebank.unblock_credit(self.time_required)

    def __str__(self):
        return self.title

class Exchange(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    offer = models.ForeignKey(
        Offer, on_delete=models.CASCADE, null=True, blank=True)
    offer_2 = models.ForeignKey(
        Offer, on_delete=models.CASCADE, null=True, blank=True, related_name='offer_2', limit_choices_to={'type': 'want'})
    provider = models.ForeignKey(User, on_delete=models.CASCADE,
                                 related_name='exchanges_provided', null=True, blank=True)
    requester = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='exchanges_requested', null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='PENDING')
    time_spent = models.IntegerField(null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Exchange {self.id} - {self.status}"


class TimeBankTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('EARN', 'Earn'),
        ('SPEND', 'Spend'),
    ]

    from_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='transactions_sent')
    to_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='transactions_received')
    exchange = models.ForeignKey(
        Exchange, on_delete=models.CASCADE, null=True, blank=True)
    time_amount = models.IntegerField(default=0)
    transaction_type = models.CharField(
        max_length=10, choices=TRANSACTION_TYPE_CHOICES, default='EARN')
    description = models.TextField(default='Transaction')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.from_user.email} → {self.to_user.email}: {self.time_amount}h ({self.transaction_type})"


class Handshake(models.Model):
    exchange = models.ForeignKey(Exchange, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=255, choices=[(
        "pending", "Pending"), ("accepted", "Accepted"), ("rejected", "Rejected")])
    
    def __str__(self):
        return f"{self.exchange.offer.title} - {self.exchange.offer_2.title}"


class Comment(models.Model):
    TARGET_TYPE_CHOICES = [
        ('exchange', 'Exchange'),
        ('offer', 'Offer'),
        ('want', 'Want'),
        ('user', 'User'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='comments')
    target_type = models.CharField(
        max_length=20, choices=TARGET_TYPE_CHOICES, default='exchange')
    # Generic ID for any target
    target_id = models.CharField(max_length=50, default='0')
    exchange = models.ForeignKey(
        Exchange, on_delete=models.CASCADE, null=True, blank=True, related_name='comments')
    content = models.TextField()
    rating = models.IntegerField(null=True, blank=True)  # 1-5
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.user.email} on {self.target_type} {self.target_id}"


class Chat(models.Model):
    exchange = models.ForeignKey(Exchange, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.exchange.offer.title} - {self.exchange.offer_2.title}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}"


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.chat.exchange.offer.title} - {self.chat.exchange.offer_2.title}"


class TimeBank(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='timebank')
    amount = models.IntegerField(default=1)
    blocked_amount = models.IntegerField(default=0)
    available_amount = models.IntegerField(default=1)
    total_amount = models.IntegerField(default=1)
    last_update = models.DateTimeField(auto_now=True)


def offer_image_path(instance, filename):
    """Generate upload path for offer images"""
    import uuid
    ext = filename.split('.')[-1]
    new_filename = f"{uuid.uuid4()}.{ext}"
    return f"offers/{instance.offer.id}/{new_filename}"


class OfferImage(models.Model):
    """Image model for Offers and Wants"""
    offer = models.ForeignKey(
        Offer, on_delete=models.CASCADE, related_name='offer_images')
    image = models.ImageField(upload_to=offer_image_path)
    caption = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', '-created_at']

    def __str__(self):
        return f"Image for {self.offer.title}"

    def add_credit(self, hours=1):
        self.amount += hours
        self.available_amount += hours
        self.total_amount += hours
        self.save()

    def spend_credit(self, hours=1):
        if self.available_amount >= hours:
            self.amount -= hours
            self.available_amount -= hours
            self.save()
            return True
        return False

    def block_credit(self, hours=1):
        if self.available_amount >= hours:
            self.blocked_amount += hours
            self.available_amount -= hours
            self.save()
            return True
        return False

    def unblock_credit(self, hours=1):
        self.blocked_amount -= hours
        self.available_amount += hours
        self.save()

    def __str__(self):
        return f"{self.user.email} - {self.amount}h"
