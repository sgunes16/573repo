from django.contrib import admin
from .models import User, UserProfile, Offer, Exchange, TimeBankTransaction, TimeBank, Comment, Chat, Message

admin.site.register(User)
admin.site.register(UserProfile)
admin.site.register(Offer)
admin.site.register(Exchange)
admin.site.register(TimeBankTransaction)
admin.site.register(TimeBank)
admin.site.register(Comment)
admin.site.register(Chat)
admin.site.register(Message)
