"""
Custom middleware for the Hive application.
"""


class RemoveTrailingSlashMiddleware:
    """
    Middleware that removes trailing slashes from URL paths.
    This ensures both /api/user-profile and /api/user-profile/ work.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Remove trailing slash from path (except for root path)
        if request.path != '/' and request.path.endswith('/'):
            # Modify the path_info to remove trailing slash
            request.path_info = request.path_info.rstrip('/')
            request.path = request.path.rstrip('/')

        response = self.get_response(request)
        return response

