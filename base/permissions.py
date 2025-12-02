from rest_framework.permissions import BasePermission

# === PERMISO GENERAL ===
class IsAuthenticatedAndActive(BasePermission):
    """
    Permite acceso solo a usuarios autenticados y con cuenta activa.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
        )


# === PERMISOS POR ROL ===

class IsGerente(BasePermission):
    """Permite acceso solo a usuarios con tipo GERENTE."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.tipo == "GERENTE"


class IsAdministrador(BasePermission):
    """Permite acceso solo a usuarios con tipo ADMINISTRADOR."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.tipo == "ADMINISTRADOR"


class IsVendedor(BasePermission):
    """Permite acceso solo a usuarios con tipo VENDEDOR."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.tipo == "VENDEDOR"


class IsAlmacenista(BasePermission):
    """Permite acceso solo a usuarios con tipo ALMACENISTA."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.tipo == "ALMACENISTA"


class IsTransportista(BasePermission):
    """Permite acceso solo a usuarios con tipo TRANSPORTISTA."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.tipo == "TRANSPORTISTA"


# === PERMISOS COMBINADOS ===

class IsGerenteOrAdmin(BasePermission):
    """Acceso a GERENTE o ADMINISTRADOR."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.tipo in ["GERENTE", "ADMINISTRADOR"]


class IsGerenteOrAlmacenista(BasePermission):
    """Acceso a GERENTE o ALMACENISTA."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.tipo in ["GERENTE", "ALMACENISTA"]


class IsAdminOrAlmacenista(BasePermission):
    """Acceso a ADMINISTRADOR o ALMACENISTA."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.tipo in ["ADMINISTRADOR", "ALMACENISTA"]
