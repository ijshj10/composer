# -*- coding: utf-8 -*-

# This code is part of Qiskit.
#
# (C) Copyright IBM 2019.
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.


from qiskit.providers import providerutils
from qiskit.providers.exceptions import QiskitBackendNotFoundError

from .quiqcl_backend import QuiqclChipTrapDevice, QuiqclBladeTrapDevice
from qiskit_quiqcl import quiqcl_client as qclient
from qiskit_quiqcl import util


class QuiqclProvider:
    """Provider for backends from Quiqcl Lab at SNU (Quiqcl).

    Typical usage is:

    .. code-block:: python

        from qiskit_quiqcl import quiqcl_provider as provider

        quiqcl = provider.QuiqclProvider.from_file('credentials.json')

        backend = quiqcl.backends.quiqcl_chip_trap

    where `'credentials.json'` is the credentials JSON file which contains
      credential information.

    Attributes:
        client: QuiqclClient object.
        name (str): Name of the provider instance.
        backends (BackendService): A service instance that allows
                                   for grabbing backends.
    """

    @classmethod
    def from_file(cls, credentials_path):
        """Returns a QuiqclProvider object with the given credentials file."""
        credentials = util.load_credentials(credentials_path)
        return cls(credentials)

    def __init__(self, credentials):
        """
        Args:
            credentials: A dictionary which contains credential information.
              It should follow the form of credential JSON file, and the
              server_address should be a tuple, not a list.
        """
        self.client = qclient.QuiqclClient.from_dict(credentials)
        self.name = 'quiqcl_provider'
        # the list of Quiqcl backends
        self.backends = BackendService([QuiqclChipTrapDevice(provider=self),
                                        QuiqclBladeTrapDevice(provider=self)])

    def __str__(self):
        return "<QuiqclProvider(name={})>".format(self.name)

    def __repr__(self):
        return self.__str__()

    def get_backend(self, name=None, **kwargs):
        """Return a single backend matching the specified filtering.
        Args:
            name (str): name of the backend.
            **kwargs: dict used for filtering.
        Returns:
            Backend: a backend matching the filtering.
        Raises:
            QiskitBackendNotFoundError: if no backend could be found or
                more than one backend matches the filtering criteria.
        """
        backends = self.backends(name, **kwargs)
        if len(backends) > 1:
            raise QiskitBackendNotFoundError('More than one backend matches criteria.')
        if not backends:
            raise QiskitBackendNotFoundError('No backend matches criteria.')

        return backends[0]

    def __eq__(self, other):
        """Equality comparison.
        By default, it is assumed that two `Providers` from the same class are
        equal. Subclassed providers can override this behavior.
        """
        return type(self).__name__ == type(other).__name__


class BackendService:
    """A service class that allows autocompletion of backends from provider."""

    def __init__(self, backends):
        """Initialize service

        Parameters:
            backends (list): List of backend instances.
        """
        self._backends = backends
        for backend in backends:
            setattr(self, backend.name(), backend)

    def __call__(self, name=None, filters=None, **kwargs):
        """A listing of all backends from this provider.

        Parameters:
            name (str): The name of a given backend.
            filters (callable): A filter function.

        Returns:
            list: A list of backends, if any.
        """
        # pylint: disable=arguments-differ
        backends = self._backends
        if name:
            backends = [
                backend for backend in backends if backend.name() == name]

        return providerutils.filter_backends(backends, filters, **kwargs)
