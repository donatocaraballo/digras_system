from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]