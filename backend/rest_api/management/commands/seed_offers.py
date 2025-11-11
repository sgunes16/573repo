from django.core.management.base import BaseCommand
from rest_api.models import User, UserProfile, Offer, Exchange, TimeBankTransaction, Comment, TimeBank
import hashlib
from datetime import datetime, timedelta
from django.utils import timezone


def password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()


class Command(BaseCommand):
    help = 'Seed database with mock users, profiles, offers, exchanges, transactions, and comments'

    def handle(self, *args, **kwargs):
        self.stdout.write('🌱 Starting to seed database...\n')

        # Mock Users Data - Turkish names, English activities
        mock_users_data = [
            {
                'email': 'ahmet.yilmaz@example.com',
                'first_name': 'Ahmet',
                'last_name': 'Yılmaz',
                'profile': {
                    'bio': 'Passionate piano teacher with 10 years experience',
                    'location': 'Beşiktaş, Istanbul',
                    'skills': ['Piano', 'Music Theory', 'Composition'],
                    'time_credits': 47,
                    'rating': 5.0,
                    'phone_number': '+90 555 123 4567',
                }
            },
            {
                'email': 'zeynep.kaya@example.com',
                'first_name': 'Zeynep',
                'last_name': 'Kaya',
                'profile': {
                    'bio': 'Professional dog walker and pet care specialist',
                    'location': 'Bebek, Istanbul',
                    'skills': ['Dog Walking', 'Pet Care', 'Training'],
                    'time_credits': 32,
                    'rating': 4.9,
                }
            },
            {
                'email': 'mehmet.demir@example.com',
                'first_name': 'Mehmet',
                'last_name': 'Demir',
                'profile': {
                    'bio': 'English teacher and language coach',
                    'location': 'Etiler, Istanbul',
                    'skills': ['English', 'Teaching', 'IELTS Prep'],
                    'time_credits': 85,
                    'rating': 4.8,
                }
            },
            {
                'email': 'ayse.sahin@example.com',
                'first_name': 'Ayşe',
                'last_name': 'Şahin',
                'profile': {
                    'bio': 'Green thumb and urban gardening expert',
                    'location': 'Kartal, Istanbul',
                    'skills': ['Gardening', 'Plant Care', 'Composting'],
                    'time_credits': 56,
                    'rating': 4.7,
                }
            },
            {
                'email': 'can.ozturk@example.com',
                'first_name': 'Can',
                'last_name': 'Öztürk',
                'profile': {
                    'bio': 'Handyman and home repair specialist',
                    'location': 'Maltepe, Istanbul',
                    'skills': ['Plumbing', 'Electrical', 'Carpentry'],
                    'time_credits': 41,
                    'rating': 4.8,
                }
            },
            {
                'email': 'elif.arslan@example.com',
                'first_name': 'Elif',
                'last_name': 'Arslan',
                'profile': {
                    'bio': 'Professional yoga instructor and wellness coach',
                    'location': 'Ortaköy, Istanbul',
                    'skills': ['Yoga', 'Meditation', 'Wellness'],
                    'time_credits': 63,
                    'rating': 5.0,
                }
            },
            {
                'email': 'burak.celik@example.com',
                'first_name': 'Burak',
                'last_name': 'Çelik',
                'profile': {
                    'bio': 'Tech enthusiast and programming mentor',
                    'location': 'Kadıköy, Istanbul',
                    'skills': ['Python', 'JavaScript', 'Web Development'],
                    'time_credits': 92,
                    'rating': 4.9,
                }
            },
            {
                'email': 'deniz.yildiz@example.com',
                'first_name': 'Deniz',
                'last_name': 'Yıldız',
                'profile': {
                    'bio': 'Graphic designer and UI/UX specialist',
                    'location': 'Sarıyer, Istanbul',
                    'skills': ['Graphic Design', 'UI/UX', 'Adobe Suite'],
                    'time_credits': 28,
                    'rating': 4.6,
                }
            },
            {
                'email': 'seda.kara@example.com',
                'first_name': 'Seda',
                'last_name': 'Kara',
                'profile': {
                    'bio': 'Childcare provider and early education specialist',
                    'location': 'Pendik, Istanbul',
                    'skills': ['Childcare', 'Education', 'Activities'],
                    'time_credits': 71,
                    'rating': 5.0,
                }
            },
            {
                'email': 'emre.bulut@example.com',
                'first_name': 'Emre',
                'last_name': 'Bulut',
                'profile': {
                    'bio': 'Professional photographer and videographer',
                    'location': 'Üsküdar, Istanbul',
                    'skills': ['Photography', 'Videography', 'Editing'],
                    'time_credits': 45,
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
                    'phone_number': profile_data.get('phone_number', ''),
                }
            )
            
            if profile_created:
                self.stdout.write(f'  ✅ Created profile for: {user.email}')
            else:
                self.stdout.write(f'  ⏭️  Profile already exists for: {user.email}')
            
            timebank, tb_created = TimeBank.objects.get_or_create(
                user=user,
                defaults={
                    'amount': profile_data.get('time_credits', 1),
                    'available_amount': profile_data.get('time_credits', 1),
                    'total_amount': profile_data.get('time_credits', 1),
                }
            )
            if tb_created:
                self.stdout.write(f'  ✅ Created TimeBank for: {user.email}')
            
            created_users.append(user)

        # Boğaziçi ve Kartal çevresinde koordinatlar
        bogazici_coords = [
            [41.0857, 29.0444],  # Boğaziçi Üniversitesi
            [41.0820, 29.0490],  # Bebek
            [41.0895, 29.0360],  # Rumeli Hisarı
            [41.0750, 29.0550],  # Beşiktaş
            [41.0700, 29.0280],  # Ortaköy
            [41.1050, 29.0520],  # Sarıyer
            [41.0800, 29.0600],  # Etiler
        ]
        
        kartal_coords = [
            [40.9008, 29.1803],  # Kartal Merkez
            [40.8950, 29.1650],  # Kartal Sahil
            [40.9100, 29.1900],  # Kartal Yakacık
            [40.9050, 29.1450],  # Maltepe
            [40.8850, 29.2050],  # Pendik
            [40.8800, 29.1300],  # Dragos
            [40.8982, 29.1742],  # Uğur Mumcu, Kartal
        ]

        # Mock Offers Data - English activities
        mock_offers_data = [
            {
                'user_email': 'ahmet.yilmaz@example.com',
                'type': 'offer',
                'title': 'Piano Lessons for Beginners',
                'description': 'Individual piano lessons for all ages. Learn theory, technique and your favorite songs.',
                'time_required': 1,
                'location': 'Beşiktaş Cultural Center',
                'geo_location': bogazici_coords[3],
                'tags': ['music', 'piano', 'lessons'],
                'status': 'ACTIVE',
                'activity_type': '1to1',
                'offer_type': '1time',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'zeynep.kaya@example.com',
                'type': 'offer',
                'title': 'Daily Dog Walking Service',
                'description': 'Professional dog walking in Bebek parks. Safe, fun and exercise for your furry friend.',
                'time_required': 1,
                'location': 'Bebek Park',
                'geo_location': bogazici_coords[1],
                'tags': ['pets', 'dogs', 'walking'],
                'status': 'ACTIVE',
                'activity_type': '1to1',
                'offer_type': 'recurring',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'mehmet.demir@example.com',
                'type': 'offer',
                'title': 'English Conversation Practice',
                'description': 'Improve your English speaking skills through natural conversation and real-world scenarios.',
                'time_required': 1,
                'location': 'Etiler Coffee House',
                'geo_location': bogazici_coords[6],
                'tags': ['english', 'language', 'education'],
                'status': 'ACTIVE',
                'activity_type': 'group',
                'offer_type': 'recurring',
                'person_count': 4,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'ayse.sahin@example.com',
                'type': 'offer',
                'title': 'Urban Gardening Workshop',
                'description': 'Learn how to grow vegetables and herbs in small spaces. Perfect for apartment balconies.',
                'time_required': 2,
                'location': 'Kartal Community Garden',
                'geo_location': kartal_coords[0],
                'tags': ['gardening', 'sustainability', 'workshop'],
                'status': 'ACTIVE',
                'activity_type': 'group',
                'offer_type': '1time',
                'person_count': 6,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'can.ozturk@example.com',
                'type': 'offer',
                'title': 'Home Repair and Maintenance',
                'description': 'Quick fixes for plumbing, electrical and carpentry issues. Same-day service available.',
                'time_required': 2,
                'location': 'Maltepe Neighborhood',
                'geo_location': kartal_coords[3],
                'tags': ['repair', 'handyman', 'maintenance'],
                'status': 'ACTIVE',
                'activity_type': '1to1',
                'offer_type': '1time',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'elif.arslan@example.com',
                'type': 'offer',
                'title': 'Morning Yoga Session',
                'description': 'Start your day with energizing yoga flow. Suitable for all levels, bring your own mat.',
                'time_required': 1,
                'location': 'Ortaköy Waterfront',
                'geo_location': bogazici_coords[4],
                'tags': ['yoga', 'wellness', 'fitness'],
                'status': 'ACTIVE',
                'activity_type': 'group',
                'offer_type': 'recurring',
                'person_count': 8,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'burak.celik@example.com',
                'type': 'offer',
                'title': 'Python Programming Basics',
                'description': 'Learn Python fundamentals through hands-on projects. Perfect for absolute beginners.',
                'time_required': 2,
                'location': 'Online via Zoom',
                'geo_location': [0, 0],
                'tags': ['programming', 'python', 'coding'],
                'status': 'ACTIVE',
                'activity_type': 'group',
                'offer_type': 'recurring',
                'person_count': 5,
                'location_type': 'remote',
            },
            {
                'user_email': 'deniz.yildiz@example.com',
                'type': 'offer',
                'title': 'Graphic Design Consultation',
                'description': 'Get professional feedback on your design projects. Logo, branding, UI/UX reviews.',
                'time_required': 1,
                'location': 'Sarıyer Co-working Space',
                'geo_location': bogazici_coords[5],
                'tags': ['design', 'graphics', 'consultation'],
                'status': 'ACTIVE',
                'activity_type': '1to1',
                'offer_type': '1time',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'seda.kara@example.com',
                'type': 'offer',
                'title': 'Childcare and Babysitting',
                'description': 'Experienced childcare for kids aged 3-10. Activities, homework help and fun games included.',
                'time_required': 3,
                'location': 'Pendik Residential Area',
                'geo_location': kartal_coords[4],
                'tags': ['childcare', 'babysitting', 'kids'],
                'status': 'ACTIVE',
                'activity_type': '1to1',
                'offer_type': 'recurring',
                'person_count': 2,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'emre.bulut@example.com',
                'type': 'offer',
                'title': 'Photography Workshop',
                'description': 'Learn portrait and landscape photography. Camera techniques, composition and editing basics.',
                'time_required': 3,
                'location': 'Üsküdar Waterfront',
                'geo_location': [41.0226, 29.0150],
                'tags': ['photography', 'camera', 'workshop'],
                'status': 'ACTIVE',
                'activity_type': 'group',
                'offer_type': '1time',
                'person_count': 6,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'selin@example.com',
                'type': 'want',
                'title': 'Need Help Moving Furniture',
                'description': 'Looking for someone strong to help move furniture to new apartment. Heavy lifting required.',
                'time_required': 3,
                'location': 'Beşiktaş Apartment',
                'geo_location': bogazici_coords[3],
                'tags': ['moving', 'help', 'furniture'],
                'status': 'ACTIVE',
                'activity_type': '1to1',
                'offer_type': '1time',
                'person_count': 2,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'mehmet.demir@example.com',
                'type': 'want',
                'title': 'Guitar Lessons Wanted',
                'description': 'Want to learn acoustic guitar basics. Looking for patient teacher for weekly sessions.',
                'time_required': 1,
                'location': 'Etiler',
                'geo_location': bogazici_coords[6],
                'tags': ['music', 'guitar', 'learning'],
                'status': 'ACTIVE',
                'activity_type': '1to1',
                'offer_type': 'recurring',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'deniz.yildiz@example.com',
                'type': 'want',
                'title': 'Web Development Mentorship',
                'description': 'Looking for experienced developer to review my code and guide me on best practices.',
                'time_required': 2,
                'location': 'Online via Meet',
                'geo_location': [0, 0],
                'tags': ['coding', 'mentorship', 'webdev'],
                'status': 'ACTIVE',
                'activity_type': '1to1',
                'offer_type': 'recurring',
                'person_count': 1,
                'location_type': 'remote',
            },
            {
                'user_email': 'seda.kara@example.com',
                'type': 'want',
                'title': 'Evening Jogging Partner',
                'description': 'Want a jogging partner for evening runs around Pendik coast. Beginner friendly.',
                'time_required': 1,
                'location': 'Pendik Coastal Road',
                'geo_location': kartal_coords[4],
                'tags': ['fitness', 'jogging', 'partner'],
                'status': 'ACTIVE',
                'activity_type': '1to1',
                'offer_type': 'recurring',
                'person_count': 1,
                'location_type': 'myLocation',
            },
            {
                'user_email': 'ayse.sahin@example.com',
                'type': 'want',
                'title': 'Turkish Cooking Partner',
                'description': 'Looking for someone to cook traditional Turkish dishes together and exchange recipes.',
                'time_required': 2,
                'location': 'Uğur Mumcu, Kartal',
                'geo_location': kartal_coords[6],
                'tags': ['cooking', 'food', 'culture'],
                'status': 'ACTIVE',
                'activity_type': '1to1',
                'offer_type': 'recurring',
                'person_count': 1,
                'location_type': 'myLocation',
            },
        ]

        # Create Offers & Wants
        self.stdout.write('\n📝 Creating offers and wants...')
        for offer_data in mock_offers_data:
            try:
                user = User.objects.get(email=offer_data['user_email'])
                
                # Set date to next week
                offer_date = timezone.now().date() + timedelta(days=7)
                offer_time = datetime.strptime('10:00', '%H:%M').time()
                
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
                        'status': offer_data['status'],
                        'activity_type': offer_data['activity_type'],
                        'offer_type': offer_data['offer_type'],
                        'person_count': offer_data['person_count'],
                        'location_type': offer_data['location_type'],
                        'date': offer_date,
                        'time': offer_time,
                        'from_date': timezone.now() + timedelta(days=7, hours=10),
                        'to_date': timezone.now() + timedelta(days=7, hours=10 + offer_data['time_required']),
                    }
                )
                
                type_label = 'want' if offer_data.get('type') == 'want' else 'offer'
                if created:
                    self.stdout.write(f'✅ Created {type_label}: {offer.title} by {user.first_name}')
                else:
                    self.stdout.write(f'⏭️  {type_label.capitalize()} already exists: {offer.title}')
            except User.DoesNotExist:
                self.stdout.write(f'❌ User not found: {offer_data["user_email"]}')

        # Create Selin FIRST (before offers so she can have wants)
        self.stdout.write('\n📝 Creating Selin (current user)...')
        selin, created = User.objects.get_or_create(
            email='selin@example.com',
            defaults={
                'first_name': 'Selin',
                'last_name': 'Güneş',
                'password': password_hash('password123'),
            }
        )
        
        if created:
            self.stdout.write(f'✅ Created user: {selin.email}')
        else:
            self.stdout.write(f'⏭️  User already exists: {selin.email}')
        
        selin_profile, profile_created = UserProfile.objects.update_or_create(
            user=selin,
            defaults={
                'bio': 'Design student and community enthusiast at Boğaziçi University',
                'location': 'Beşiktaş, Istanbul',
                'skills': ['Design', 'Art', 'Communication'],
                'rating': 4.9,
            }
        )
        
        if profile_created:
            self.stdout.write(f'  ✅ Created profile for: {selin.email}')
        else:
            self.stdout.write(f'  ⏭️  Profile already exists for: {selin.email}')
        
        selin_timebank, tb_created = TimeBank.objects.get_or_create(
            user=selin,
            defaults={
                'amount': 12,
                'available_amount': 12,
                'total_amount': 12,
            }
        )
        if tb_created:
            self.stdout.write(f'  ✅ Created TimeBank for: {selin.email}')

        # Create Exchanges
        self.stdout.write('\n📝 Creating exchanges...')
        exchanges = {}
        exchange_data = [
            {'provider': 'ahmet.yilmaz@example.com', 'requester': 'selin@example.com', 'time': 1},
            {'provider': 'zeynep.kaya@example.com', 'requester': 'selin@example.com', 'time': 1},
            {'provider': 'selin@example.com', 'requester': 'mehmet.demir@example.com', 'time': 1},
            {'provider': 'ayse.sahin@example.com', 'requester': 'selin@example.com', 'time': 2},
            {'provider': 'selin@example.com', 'requester': 'can.ozturk@example.com', 'time': 2},
        ]
        
        for i, ex_data in enumerate(exchange_data, 1):
            try:
                provider = User.objects.get(email=ex_data['provider'])
                requester = User.objects.get(email=ex_data['requester'])
                
                exchange, created = Exchange.objects.get_or_create(
                    provider=provider,
                    requester=requester,
                    defaults={
                        'status': 'COMPLETED',
                        'time_spent': ex_data['time'],
                        'rating': 5,
                        'feedback': 'Great exchange!',
                        'completed_at': timezone.now() - timedelta(days=i),
                    }
                )
                exchanges[f'ex{i}'] = exchange
                if created:
                    self.stdout.write(f'✅ Created exchange: {provider.first_name} ↔ {requester.first_name}')
            except User.DoesNotExist:
                pass

        # Create Transactions
        self.stdout.write('\n📝 Creating transactions...')
        for i, ex_data in enumerate(exchange_data, 1):
            try:
                from_user = User.objects.get(email=ex_data['provider'])
                to_user = User.objects.get(email=ex_data['requester'])
                exchange = exchanges.get(f'ex{i}')
                
                transaction, created = TimeBankTransaction.objects.get_or_create(
                    from_user=from_user,
                    to_user=to_user,
                    exchange=exchange,
                    defaults={
                        'time_amount': ex_data['time'],
                        'transaction_type': 'EARN' if to_user == selin else 'SPEND',
                        'description': f'Time exchange between {from_user.first_name} and {to_user.first_name}',
                    }
                )
                
                if created:
                    self.stdout.write(f'✅ Created transaction: {from_user.first_name} → {to_user.first_name}')
            except User.DoesNotExist:
                pass

        # Create Comments
        self.stdout.write('\n📝 Creating comments...')
        comments_data = [
            {
                'user': 'selin@example.com',
                'exchange': 'ex1',
                'content': 'Ahmet is an amazing piano teacher! Very patient and knowledgeable.',
                'rating': 5,
            },
            {
                'user': 'ahmet.yilmaz@example.com',
                'exchange': 'ex1',
                'content': 'Selin is a dedicated student. Great progress in just one session!',
                'rating': 5,
            },
            {
                'user': 'selin@example.com',
                'exchange': 'ex2',
                'content': 'Zeynep took excellent care of my dog. Highly recommend!',
                'rating': 5,
            },
        ]
        
        for comment_data in comments_data:
            try:
                user = User.objects.get(email=comment_data['user'])
                exchange = exchanges.get(comment_data['exchange'])
                
                if exchange:
                    comment, created = Comment.objects.get_or_create(
                        user=user,
                        exchange=exchange,
                        target_type='exchange',
                        target_id=str(exchange.id),
                        defaults={
                            'content': comment_data['content'],
                            'rating': comment_data['rating'],
                        }
                    )
                    
                    if created:
                        self.stdout.write(f'✅ Created comment by {user.first_name}')
            except User.DoesNotExist:
                pass

        self.stdout.write('\n🎉 Database seeding completed!')
        self.stdout.write(f'📊 Total users: {User.objects.count()}')
        self.stdout.write(f'📊 Total offers: {Offer.objects.count()}')
        self.stdout.write(f'📊 Total exchanges: {Exchange.objects.count()}')
