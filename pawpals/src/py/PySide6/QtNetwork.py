"""QtNetwork stand-in: the page has no raw sockets (the shared room goes over PeerJS instead)."""
from .QtCore import QObject, Signal


class _Stub(QObject):
    def __init__(self, *a, **k):
        super().__init__()

    def __getattr__(self, name):
        if name.startswith("__"):
            raise AttributeError(name)
        return lambda *a, **k: None


class QAbstractSocket(_Stub):
    IPv4Protocol, IPv6Protocol, AnyIPProtocol = 0, 1, 2
    ConnectedState, UnconnectedState = 3, 0
    ShareAddress, ReuseAddressHint = 1, 4


class QTcpSocket(QAbstractSocket):
    readyRead = Signal()
    connected = Signal()
    disconnected = Signal()
    errorOccurred = Signal()


class QSslSocket(QTcpSocket):
    @staticmethod
    def supportsSsl():
        return False


class QTcpServer(_Stub):
    newConnection = Signal()


class QUdpSocket(QAbstractSocket):
    readyRead = Signal()


class QHostAddress(_Stub):
    Any, AnyIPv4, AnyIPv6, LocalHost = 0, 1, 2, 3


class QNetworkInterface(_Stub):
    IsUp, IsRunning, IsLoopBack = 1, 2, 8

    @staticmethod
    def allInterfaces():
        return []

    @staticmethod
    def allAddresses():
        return []


class QNetworkAccessManager(_Stub):
    finished = Signal()


class QNetworkRequest(_Stub):
    pass


class QNetworkReply(_Stub):
    finished = Signal()


class QNetworkProxyFactory(_Stub):
    @staticmethod
    def setUseSystemConfiguration(*a):
        pass


class QLocalSocket(_Stub):
    pass


class QLocalServer(_Stub):
    newConnection = Signal()

    @staticmethod
    def removeServer(*a):
        pass
