from django.db import models

# Create your models here.


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
    badges = models.JSONField(default=list)
    achievements = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name if self.display_name else self.user.email


class Offer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255)
    geo_location = models.CharField(max_length=255)
    tags = models.JSONField(default=list)
    images = models.JSONField(default=list)
    videos = models.JSONField(default=list)
    audio = models.JSONField(default=list)
    documents = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def update_timebank(self):
        self.user.timebank.amount -= 1
        self.user.timebank.blocked_amount += 1
        self.user.timebank.available_amount -= 1
        self.user.timebank.total_amount -= 1
        self.user.timebank.last_update = timezone.now()
        self.user.timebank.save()

    def release_timebank(self):
        self.user.timebank.amount += 1
        self.user.timebank.blocked_amount -= 1
        self.user.timebank.available_amount += 1
        self.user.timebank.total_amount += 1
        self.user.timebank.last_update = timezone.now()
        self.user.timebank.save()

    def __str__(self):
        return self.title


class Want(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    geo_location = models.CharField(max_length=255)
    tags = models.JSONField(default=list)
    images = models.JSONField(default=list)
    videos = models.JSONField(default=list)
    audio = models.JSONField(default=list)
    documents = models.JSONField(default=list)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Exchange(models.Model):
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE)
    want = models.ForeignKey(Want, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.offer.title} - {self.want.title}"


class TimeBankTransaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    exchange = models.ForeignKey(Exchange, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.amount}"


class Handshake(models.Model):
    exchange = models.ForeignKey(Exchange, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=255, choices=[(
        "pending", "Pending"), ("accepted", "Accepted"), ("rejected", "Rejected")])

    def __str__(self):
        return f"{self.exchange.offer.title} - {self.exchange.want.title}"


class Comment(models.Model):
    exchange = models.ForeignKey(Exchange, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.exchange.offer.title} - {self.exchange.want.title}"


class Chat(models.Model):
    exchange = models.ForeignKey(Exchange, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.exchange.offer.title} - {self.exchange.want.title}"


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
        return f"{self.chat.exchange.offer.title} - {self.chat.exchange.want.title}"


class TimeBank(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.IntegerField()
    blocked_amount = models.IntegerField()
    available_amount = models.IntegerField()
    total_amount = models.IntegerField()
    last_update = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.amount}"
