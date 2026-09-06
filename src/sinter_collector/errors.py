"""Domain errors shared by collectors and the command-line interface."""


class SourceStructureError(ValueError):
    """Raised when a public source no longer has recognizable records."""
