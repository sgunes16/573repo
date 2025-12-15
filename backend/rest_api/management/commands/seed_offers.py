from django.core.management.base import BaseCommand
from rest_api.models import User, UserProfile, Offer, Exchange, TimeBankTransaction, TimeBank, ExchangeRating
import hashlib
from datetime import datetime, timedelta
from django.utils import timezone


def password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()


class Command(BaseCommand):
    help = 'Seed database with community-focused users, profiles, offers and wants'

    def handle(self, *args, **kwargs):
        self.stdout.write('🌱 Starting to seed database...\n')

        # Istanbul neighborhood coordinates
        LOCATIONS = {
            'umraniye': {
                'name': 'Ümraniye, İstanbul',
                'coords': [41.0166, 29.1250],
            },
            'bebek': {
                'name': 'Bebek, İstanbul',
                'coords': [41.0820, 29.0490],
            },
            'sariyer': {
                'name': 'Sarıyer, İstanbul',
                'coords': [41.1050, 29.0520],
            },
            'hisarustu': {
                'name': 'Hisarüstü, İstanbul',
                'coords': [41.0857, 29.0444],
            },
            'kadikoy': {
                'name': 'Kadıköy, İstanbul',
                'coords': [40.9928, 29.0292],
            },
            'besiktas': {
                'name': 'Beşiktaş, İstanbul',
                'coords': [41.0750, 29.0550],
            },
            'uskudar': {
                'name': 'Üsküdar, İstanbul',
                'coords': [41.0226, 29.0150],
            },
            'maltepe': {
                'name': 'Maltepe, İstanbul',
                'coords': [40.9350, 29.1450],
            },
            'camlica': {
                'name': 'Çamlıca, İstanbul',
                'coords': [41.0275, 29.0642],
            },
            'ortakoy': {
                'name': 'Ortaköy, İstanbul',
                'coords': [41.0480, 29.0270],
            },
            'moda': {
                'name': 'Moda, İstanbul',
                'coords': [40.9873, 29.0256],
            },
            'etiler': {
                'name': 'Etiler, İstanbul',
                'coords': [41.0800, 29.0350],
            },
        }

        # Mock Users Data
        mock_users_data = [
            {
                'email': 'ahmet.yilmaz@example.com',
                'first_name': 'Ahmet',
                'last_name': 'Yılmaz',
                'is_verified': True,
                'profile': {
                    'bio': 'Retired teacher, love helping the community and sharing knowledge',
                    'location': LOCATIONS['umraniye']['name'],
                    'skills': ['Teaching', 'Gardening', 'Chess'],
                    'time_credits': 25,
                    'rating': 4.9,
                }
            },
            {
                'email': 'zeynep.kaya@example.com',
                'first_name': 'Zeynep',
                'last_name': 'Kaya',
                'is_verified': True,
                'profile': {
                    'bio': 'Animal lover and volunteer at local shelter',
                    'location': LOCATIONS['bebek']['name'],
                    'skills': ['Pet Care', 'Cooking', 'Knitting'],
                    'time_credits': 18,
                    'rating': 5.0,
                }
            },
            {
                'email': 'mehmet.demir@example.com',
                'first_name': 'Mehmet',
                'last_name': 'Demir',
                'is_verified': True,
                'profile': {
                    'bio': 'University student, good with tech and languages',
                    'location': LOCATIONS['hisarustu']['name'],
                    'skills': ['English', 'Computer Help', 'Translation'],
                    'time_credits': 32,
                    'rating': 4.8,
                }
            },
            {
                'email': 'ayse.sahin@example.com',
                'first_name': 'Ayşe',
                'last_name': 'Şahin',
                'is_verified': True,
                'profile': {
                    'bio': 'Stay-at-home mom, love organizing community events',
                    'location': LOCATIONS['sariyer']['name'],
                    'skills': ['Event Planning', 'Childcare', 'Baking'],
                    'time_credits': 45,
                    'rating': 4.9,
                }
            },
            {
                'email': 'can.ozturk@example.com',
                'first_name': 'Can',
                'last_name': 'Öztürk',
                'is_verified': True,
                'profile': {
                    'bio': 'Handyman and DIY enthusiast, happy to help neighbors',
                    'location': LOCATIONS['kadikoy']['name'],
                    'skills': ['Repair', 'Carpentry', 'Plumbing'],
                    'time_credits': 38,
                    'rating': 4.7,
                }
            },
            {
                'email': 'elif.arslan@example.com',
                'first_name': 'Elif',
                'last_name': 'Arslan',
                'is_verified': True,
                'profile': {
                    'bio': 'Yoga instructor and wellness advocate',
                    'location': LOCATIONS['ortakoy']['name'],
                    'skills': ['Yoga', 'Meditation', 'Nutrition'],
                    'time_credits': 28,
                    'rating': 5.0,
                }
            },
            {
                'email': 'burak.celik@example.com',
                'first_name': 'Burak',
                'last_name': 'Çelik',
                'is_verified': True,
                'profile': {
                    'bio': 'Software developer, love teaching coding to beginners',
                    'location': LOCATIONS['moda']['name'],
                    'skills': ['Programming', 'Web Development', 'Mentoring'],
                    'time_credits': 52,
                    'rating': 4.8,
                }
            },
            {
                'email': 'deniz.yildiz@example.com',
                'first_name': 'Deniz',
                'last_name': 'Yıldız',
                'is_verified': True,
                'profile': {
                    'bio': 'Graphic designer and creative workshop facilitator',
                    'location': LOCATIONS['besiktas']['name'],
                    'skills': ['Design', 'Art', 'Photography'],
                    'time_credits': 22,
                    'rating': 4.6,
                }
            },
            {
                'email': 'seda.kara@example.com',
                'first_name': 'Seda',
                'last_name': 'Kara',
                'is_verified': True,
                'profile': {
                    'bio': 'Early childhood educator, organizing kids activities',
                    'location': LOCATIONS['maltepe']['name'],
                    'skills': ['Childcare', 'Education', 'Crafts'],
                    'time_credits': 35,
                    'rating': 5.0,
                }
            },
            {
                'email': 'emre.bulut@example.com',
                'first_name': 'Emre',
                'last_name': 'Bulut',
                'is_verified': True,
                'profile': {
                    'bio': 'Cycling enthusiast and bike mechanic',
                    'location': LOCATIONS['uskudar']['name'],
                    'skills': ['Bike Repair', 'Sports', 'First Aid'],
                    'time_credits': 29,
                    'rating': 4.7,
                }
            },
        ]

        # Create Users and Profiles
        created_users = []
        for user_data in mock_users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'password': password_hash('password123'),
                    'is_verified': user_data.get('is_verified', True),
                }
            )
            
            if created:
                self.stdout.write(f'✅ Created user: {user.email}')
            else:
                self.stdout.write(f'⏭️  User already exists: {user.email}')
            
            profile_data = user_data['profile']
            profile, profile_created = UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    'bio': profile_data.get('bio', ''),
                    'location': profile_data.get('location', ''),
                    'skills': profile_data.get('skills', []),
                    'rating': profile_data.get('rating', 0.0),
                }
            )
            
            timebank, tb_created = TimeBank.objects.get_or_create(
                user=user,
                defaults={
                    'amount': profile_data.get('time_credits', 3),
                    'available_amount': profile_data.get('time_credits', 3),
                    'total_amount': profile_data.get('time_credits', 3),
                }
            )
            
            created_users.append(user)

        # Create Admin User
        self.stdout.write('\n👑 Creating admin user...')
        admin, admin_created = User.objects.get_or_create(
            email='admin@hive.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'password': password_hash('password123'),
                'is_admin': True,
                'is_verified': True,
            }
        )
        if admin_created:
            self.stdout.write(f'✅ Created admin: {admin.email}')
            TimeBank.objects.get_or_create(
                user=admin,
                defaults={'amount': 100, 'available_amount': 100, 'total_amount': 100}
            )

        # Community-focused Offers
        mock_offers_data = [
            # OFFERS - Helping the community
            {
                'user_email': 'ahmet.yilmaz@example.com',
                'type': 'offer',
                'title': 'Free Tutoring for Kids',
                'description': 'Offering free math and Turkish tutoring for elementary school kids in the neighborhood. 30+ years teaching experience.',
                'time_required': 1,
                'location': f"Ümraniye Kültür Merkezi, {LOCATIONS['umraniye']['name']}",
                'geo_location': LOCATIONS['umraniye']['coords'],
                'tags': ['education', 'kids', 'tutoring', 'free'],
                'activity_type': 'group',
                'person_count': 5,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'zeynep.kaya@example.com',
                'type': 'offer',
                'title': 'Feeding Stray Cats Together',
                'description': 'Join me for neighborhood cat feeding rounds! I provide the food, you provide company. Great way to meet neighbors.',
                'time_required': 1,
                'location': f"Bebek Parkı, {LOCATIONS['bebek']['name']}",
                'geo_location': LOCATIONS['bebek']['coords'],
                'tags': ['animals', 'community', 'volunteer', 'cats'],
                'activity_type': 'group',
                'person_count': 4,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'mehmet.demir@example.com',
                'type': 'offer',
                'title': 'Tech Help for Seniors',
                'description': 'Helping elderly neighbors with smartphones, WhatsApp, video calls with family. Patient and friendly!',
                'time_required': 1,
                'location': f"Hisarüstü Kahvesi, {LOCATIONS['hisarustu']['name']}",
                'geo_location': LOCATIONS['hisarustu']['coords'],
                'tags': ['tech', 'seniors', 'help', 'community'],
                'activity_type': '1to1',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'ayse.sahin@example.com',
                'type': 'offer',
                'title': 'Neighborhood Book Club',
                'description': 'Monthly book club meeting at my place! Tea, cookies and great discussions. All ages welcome.',
                'time_required': 2,
                'location': f"Sarıyer Çarşı, {LOCATIONS['sariyer']['name']}",
                'geo_location': LOCATIONS['sariyer']['coords'],
                'tags': ['books', 'social', 'community', 'culture'],
                'activity_type': 'group',
                'person_count': 8,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'can.ozturk@example.com',
                'type': 'offer',
                'title': 'Free Minor Home Repairs',
                'description': 'Leaky faucet? Squeaky door? I can help with small repairs for free. Just pay for materials if needed.',
                'time_required': 2,
                'location': f"Kadıköy, {LOCATIONS['kadikoy']['name']}",
                'geo_location': LOCATIONS['kadikoy']['coords'],
                'tags': ['repair', 'handyman', 'help', 'free'],
                'activity_type': '1to1',
                'person_count': 1,
                'location_type': 'theirLocation',
            },
            {
                'user_email': 'elif.arslan@example.com',
                'type': 'offer',
                'title': 'Free Yoga in the Park',
                'description': 'Weekend morning yoga sessions by the Bosphorus. Bring your mat, all levels welcome!',
                'time_required': 1,
                'location': f"Ortaköy Sahil, {LOCATIONS['ortakoy']['name']}",
                'geo_location': LOCATIONS['ortakoy']['coords'],
                'tags': ['yoga', 'wellness', 'free', 'outdoors'],
                'activity_type': 'group',
                'person_count': 15,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'burak.celik@example.com',
                'type': 'offer',
                'title': 'Coding for Beginners',
                'description': 'Want to learn programming? I teach Python basics online. Perfect for students and career changers.',
                'time_required': 2,
                'location': 'Online via Zoom',
                'geo_location': [0, 0],
                'tags': ['coding', 'education', 'programming', 'online'],
                'activity_type': 'group',
                'person_count': 6,
                'location_type': 'remote',
            },
            {
                'user_email': 'deniz.yildiz@example.com',
                'type': 'offer',
                'title': 'Photography Walk',
                'description': 'Explore hidden gems of Beşiktaş with cameras! Learn composition and street photography basics.',
                'time_required': 3,
                'location': f"Beşiktaş Meydanı, {LOCATIONS['besiktas']['name']}",
                'geo_location': LOCATIONS['besiktas']['coords'],
                'tags': ['photography', 'art', 'walking', 'learning'],
                'activity_type': 'group',
                'person_count': 8,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'seda.kara@example.com',
                'type': 'offer',
                'title': 'Kids Craft Workshop',
                'description': 'Fun craft activities for kids aged 4-10. Paper crafts, painting, and more. Parents can take a break!',
                'time_required': 2,
                'location': f"Maltepe Kültür Merkezi, {LOCATIONS['maltepe']['name']}",
                'geo_location': LOCATIONS['maltepe']['coords'],
                'tags': ['kids', 'crafts', 'activities', 'fun'],
                'activity_type': 'group',
                'person_count': 10,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'emre.bulut@example.com',
                'type': 'offer',
                'title': 'Free Bike Checkup',
                'description': 'Spring is here! Bring your bike for a free safety check and basic maintenance. I love keeping bikes on the road.',
                'time_required': 1,
                'location': f"Üsküdar Sahil Yolu, {LOCATIONS['uskudar']['name']}",
                'geo_location': LOCATIONS['uskudar']['coords'],
                'tags': ['bike', 'repair', 'free', 'cycling'],
                'activity_type': '1to1',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            # Additional community offers
            {
                'user_email': 'ahmet.yilmaz@example.com',
                'type': 'offer',
                'title': 'Chess Club for All Ages',
                'description': 'Weekly chess meetup at the park. Beginners welcome, I can teach the basics. Boards provided.',
                'time_required': 2,
                'location': f"Ümraniye Belediye Parkı, {LOCATIONS['umraniye']['name']}",
                'geo_location': LOCATIONS['umraniye']['coords'],
                'tags': ['chess', 'games', 'social', 'learning'],
                'activity_type': 'group',
                'person_count': 12,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'zeynep.kaya@example.com',
                'type': 'offer',
                'title': 'Traditional Turkish Cooking',
                'description': 'Learn to make mantı, börek and more! Cooking together is better than cooking alone.',
                'time_required': 3,
                'location': f"Bebek, {LOCATIONS['bebek']['name']}",
                'geo_location': LOCATIONS['bebek']['coords'],
                'tags': ['cooking', 'turkish', 'food', 'culture'],
                'activity_type': 'group',
                'person_count': 4,
                'location_type': 'myLocation',
            },

            # WANTS - Community needs
            {
                'user_email': 'ayse.sahin@example.com',
                'type': 'want',
                'title': 'Help Organizing Charity Bazaar',
                'description': 'Planning a charity bazaar for earthquake relief. Need volunteers for setup, sales and cleanup.',
                'time_required': 3,
                'location': f"Sarıyer Meydanı, {LOCATIONS['sariyer']['name']}",
                'geo_location': LOCATIONS['sariyer']['coords'],
                'tags': ['volunteer', 'charity', 'community', 'help'],
                'activity_type': 'group',
                'person_count': 10,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'mehmet.demir@example.com',
                'type': 'want',
                'title': 'Language Tandem Partner - German',
                'description': 'Looking for a native German speaker to practice conversation. I can help with Turkish in return!',
                'time_required': 1,
                'location': f"Hisarüstü Cafe, {LOCATIONS['hisarustu']['name']}",
                'geo_location': LOCATIONS['hisarustu']['coords'],
                'tags': ['language', 'german', 'tandem', 'exchange'],
                'activity_type': '1to1',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'deniz.yildiz@example.com',
                'type': 'want',
                'title': 'Guitar Lessons Wanted',
                'description': 'Always wanted to learn guitar. Looking for patient teacher for weekly beginner lessons.',
                'time_required': 1,
                'location': f"Beşiktaş, {LOCATIONS['besiktas']['name']}",
                'geo_location': LOCATIONS['besiktas']['coords'],
                'tags': ['music', 'guitar', 'lessons', 'learning'],
                'activity_type': '1to1',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'seda.kara@example.com',
                'type': 'want',
                'title': 'Jogging Buddy Needed',
                'description': 'Looking for a morning jogging partner. Slow pace, 3-4 km along the coast. Safety in numbers!',
                'time_required': 1,
                'location': f"Maltepe Sahil, {LOCATIONS['maltepe']['name']}",
                'geo_location': LOCATIONS['maltepe']['coords'],
                'tags': ['fitness', 'jogging', 'partner', 'morning'],
                'activity_type': '1to1',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'can.ozturk@example.com',
                'type': 'want',
                'title': 'Learn to Bake Bread',
                'description': 'Want to learn artisan bread making. Sourdough, whole wheat, anything! Happy to share the results.',
                'time_required': 2,
                'location': f"Kadıköy, {LOCATIONS['kadikoy']['name']}",
                'geo_location': LOCATIONS['kadikoy']['coords'],
                'tags': ['baking', 'bread', 'cooking', 'learning'],
                'activity_type': '1to1',
                'person_count': 1,
                'location_type': 'theirLocation',
            },
            {
                'user_email': 'emre.bulut@example.com',
                'type': 'want',
                'title': 'Swimming Lessons for Adults',
                'description': 'Never learned to swim properly. Looking for patient instructor for adult beginner lessons.',
                'time_required': 1,
                'location': f"Üsküdar, {LOCATIONS['uskudar']['name']}",
                'geo_location': LOCATIONS['uskudar']['coords'],
                'tags': ['swimming', 'lessons', 'fitness', 'learning'],
                'activity_type': '1to1',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'burak.celik@example.com',
                'type': 'want',
                'title': 'Help Moving to New Apartment',
                'description': 'Moving next weekend! Need strong helpers to carry boxes and furniture. Pizza and drinks on me!',
                'time_required': 3,
                'location': f"Moda, {LOCATIONS['moda']['name']}",
                'geo_location': LOCATIONS['moda']['coords'],
                'tags': ['moving', 'help', 'furniture', 'volunteer'],
                'activity_type': 'group',
                'person_count': 3,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'elif.arslan@example.com',
                'type': 'want',
                'title': 'Piano Practice Partner',
                'description': 'Looking for someone to practice piano with. Not lessons, just playing together for motivation!',
                'time_required': 1,
                'location': f"Ortaköy, {LOCATIONS['ortakoy']['name']}",
                'geo_location': LOCATIONS['ortakoy']['coords'],
                'tags': ['piano', 'music', 'practice', 'partner'],
                'activity_type': '1to1',
                'person_count': 1,
                'location_type': 'myLocation',
            },
        ]

        # Create Offers & Wants
        self.stdout.write('\n📝 Creating offers and wants...')
        for offer_data in mock_offers_data:
            try:
                user = User.objects.get(email=offer_data['user_email'])
                
                # Set scheduled_at to next week at 10:00
                scheduled_datetime = timezone.now() + timedelta(days=7)
                scheduled_datetime = scheduled_datetime.replace(hour=10, minute=0, second=0, microsecond=0)
                
                offer, created = Offer.objects.get_or_create(
                    user=user,
                    title=offer_data['title'],
                    defaults={
                        'type': offer_data.get('type', 'offer'),
                        'description': offer_data['description'],
                        'time_required': offer_data['time_required'],
                        'location': offer_data['location'],
                        'geo_location': offer_data['geo_location'],
                        'tags': offer_data['tags'],
                        'status': 'ACTIVE',
                        'activity_type': offer_data['activity_type'],
                        'offer_type': '1time',
                        'person_count': offer_data['person_count'],
                        'location_type': offer_data['location_type'],
                        'scheduled_at': scheduled_datetime,
                    }
                )
                
                # Block credits for wants
                if created and offer_data.get('type') == 'want':
                    try:
                        user.timebank.block_credit(offer_data['time_required'])
                    except:
                        pass
                
                type_label = 'want' if offer_data.get('type') == 'want' else 'offer'
                if created:
                    self.stdout.write(f'✅ Created {type_label}: {offer.title}')
                else:
                    self.stdout.write(f'⏭️  {type_label.capitalize()} exists: {offer.title}')
            except User.DoesNotExist:
                self.stdout.write(f'❌ User not found: {offer_data["user_email"]}')

        # Create some completed exchanges for realistic data
        self.stdout.write('\n📝 Creating sample exchanges...')
        exchange_pairs = [
            ('ahmet.yilmaz@example.com', 'mehmet.demir@example.com', 1),
            ('zeynep.kaya@example.com', 'ayse.sahin@example.com', 1),
            ('can.ozturk@example.com', 'burak.celik@example.com', 2),
            ('elif.arslan@example.com', 'deniz.yildiz@example.com', 1),
            ('seda.kara@example.com', 'emre.bulut@example.com', 2),
        ]
        
        for provider_email, requester_email, time_spent in exchange_pairs:
            try:
                provider = User.objects.get(email=provider_email)
                requester = User.objects.get(email=requester_email)
                
                # Find an offer from provider
                offer = Offer.objects.filter(user=provider, type='offer').first()
                if not offer:
                    continue
                
                exchange, created = Exchange.objects.get_or_create(
                    offer=offer,
                    provider=provider,
                    requester=requester,
                    defaults={
                        'status': 'COMPLETED',
                        'time_spent': time_spent,
                        'requester_confirmed': True,
                        'provider_confirmed': True,
                        'completed_at': timezone.now() - timedelta(days=5),
                    }
                )
                
                if created:
                    self.stdout.write(f'✅ Created exchange: {provider.first_name} → {requester.first_name}')
                    
                    # Create ratings
                    ExchangeRating.objects.get_or_create(
                        exchange=exchange,
                        rater=requester,
                        ratee=provider,
                        defaults={
                            'communication': 5,
                            'punctuality': 5,
                            'would_recommend': True,
                            'comment': f'Great experience with {provider.first_name}! Very helpful.'
                        }
                    )
                    ExchangeRating.objects.get_or_create(
                        exchange=exchange,
                        rater=provider,
                        ratee=requester,
                        defaults={
                            'communication': 5,
                            'punctuality': 4,
                            'would_recommend': True,
                            'comment': f'{requester.first_name} was very friendly and punctual.'
                        }
                    )
                    
                    # Create transaction
                    TimeBankTransaction.objects.get_or_create(
                        from_user=requester,
                        to_user=provider,
                        exchange=exchange,
                        defaults={
                            'time_amount': time_spent,
                            'transaction_type': 'EARN',
                            'description': f'Exchange: {offer.title}',
                        }
                    )
            except User.DoesNotExist:
                pass

        self.stdout.write('\n🎉 Database seeding completed!')
        self.stdout.write(f'📊 Total users: {User.objects.count()}')
        self.stdout.write(f'📊 Total offers: {Offer.objects.filter(type="offer").count()}')
        self.stdout.write(f'📊 Total wants: {Offer.objects.filter(type="want").count()}')
        self.stdout.write(f'📊 Total exchanges: {Exchange.objects.count()}')
        self.stdout.write(f'\n🔐 Login credentials:')
        self.stdout.write(f'   Admin: admin@hive.com / password123')
        self.stdout.write(f'   Users: [email]@example.com / password123')
