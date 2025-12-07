from django.core.management.base import BaseCommand
from rest_api.models import User, TimeBank


class Command(BaseCommand):
    help = 'Add time credits to a user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='Email of the user to add credits to'
        )
        parser.add_argument(
            '--hours',
            type=int,
            required=True,
            help='Number of hours to add'
        )

    def handle(self, *args, **options):
        email = options['email']
        hours = options['hours']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} not found')
            )
            return

        # Get or create TimeBank for user
        timebank, created = TimeBank.objects.get_or_create(
            user=user,
            defaults={
                'amount': 0,
                'blocked_amount': 0,
                'available_amount': 0,
                'total_amount': 0
            }
        )

        # Add credits
        timebank.add_credit(hours)

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully added {hours} hours to {user.email}\n'
                f'Current balance: {timebank.amount}H\n'
                f'Available: {timebank.available_amount}H\n'
                f'Blocked: {timebank.blocked_amount}H\n'
                f'Total: {timebank.total_amount}H'
            )
        )

