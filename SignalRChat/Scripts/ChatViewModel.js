$(function () {

    //View Models
    
    function UserDetail(connectionId, userName) {
        this.connectionId = connectionId;
        this.userName = ko.observable(userName);
    }
    function MessageDetail(viewModel, userName, message) {
        var md = this;
        md.viewModel = viewModel;
        md.userName = ko.observable(userName);
        md.message = message;
        md.isMyMessage = ko.computed(function () {
            return md.userName() == md.viewModel.myUserName();
        });
        md.avatarUrl = ko.computed(function () {
            var url = "http://placehold.it/50/";
            if (!md.isMyMessage()) {
                url += "55C1E7/fff&text=" + md.userName();
            } else {
                url += "FA6F57/fff&text=" + md.viewModel.myUserName();
            };
            return url;
        });
    }
    function ChatRoom(viewModel, roomId, roomName, users, isMain) {
        var chatRoom = this;
        chatRoom.viewModel = viewModel;

        chatRoom.isMain = isMain;
        chatRoom.roomId = roomId;
        chatRoom.roomName = roomName;
        chatRoom.isVisible = ko.observable(true);
        chatRoom.isActive = ko.observable(true);
        chatRoom.users = ko.observableArray(users);
        chatRoom.messages = ko.observableArray([]);
        chatRoom.newMessageText = ko.observable();

        chatRoom.userList = ko.computed(function() {
            return ko.utils.arrayFilter(chatRoom.users(), function(user) {
                 return user.userName != viewModel.myUserName();
            });
        });

        
    }
    function chatHubViewModel() {
        var self = this;

        self.myUserName = ko.observable();
        self.chatRooms = ko.observableArray([]);

        self.mainChatRoom = ko.computed(function() {
            return ko.utils.arrayFirst(self.chatRooms(), function (chatRoom) { return chatRoom.isMain == true; });
        });
        self.activeChatRoom = ko.computed(function() {
            return ko.utils.arrayFirst(self.chatRooms(), function (chatRoom) { return chatRoom.isActive() == true; });
        });
        self.visibleChatRooms = ko.computed(function () {
            return ko.utils.arrayFilter(self.chatRooms(), function (chatRoom) { return chatRoom.isVisible() == true; });
        });

        //ViewModel actions
        self.submitMessage = function (data, event) {
            if (event.which == 13) {
                self.sendMessage(data);
            } else {
                return true;
            }
        };
        self.sendMessage = function (chatRoom) {
            if (self.activeChatRoom().newMessageText() != '') {
                if (self.activeChatRoom().isMain) {
                    chatHub.server.sendMessageToAll(self.activeChatRoom().newMessageText());
                } else {
                    chatHub.server.sendPrivateMessage(self.activeChatRoom().roomId, self.activeChatRoom().newMessageText());
                }
                self.activeChatRoom().newMessageText('');
            }
        };
        self.openPrivateChatRoom = function (user) {
            var chatRoomToSwitch = ko.utils.arrayFirst(self.chatRooms(), function(chatRoom) {
                 return chatRoom.roomId == user.connectionId;
            } );
            if (chatRoomToSwitch == null) {
                self.activeChatRoom().isActive(false);
                self.chatRooms.push(new ChatRoom(self, user.connectionId, user.userName, [user], false));
            } else {
                chatRoomToSwitch.isVisible(true);
                self.switchChatRoom(chatRoomToSwitch);
            }
        };
        self.switchChatRoom = function (chatRoom) {
            self.activeChatRoom().isActive(false);
            chatRoom.isActive(true);
        };
        self.closeChatRoom = function (chatRoom) {
            self.switchChatRoom(self.mainChatRoom());
            chatRoom.isVisible(false);
        };

        //Handlers for our Hub callbacks
        self.registerClientMethods = function() {
            // Calls when user successfully logged in
            chatHub.client.onConnected = function (id, userName, allUsers) {
                self.myUserName = ko.observable(userName);
                self.myConnectionId = ko.observable(id);
                self.chatRooms.push(new ChatRoom(self, 1, "Main", allUsers, true));
            };
            // On New User Connected
            chatHub.client.onNewUserConnected = function (id, userName) {
                self.mainChatRoom().users.push(new UserDetail(id, userName));
            };
            chatHub.client.messageReceived = function (userName, message) {
                self.mainChatRoom().messages.push(new MessageDetail(self, userName, message));
            };
            // On User Disconnected
            chatHub.client.onUserDisconnected = function (id, userName) {
                self.mainChatRoom().users.remove(function(user) {
                    return user.connectionId == id;
                });
            };
            //Sending private message
            chatHub.client.sendPrivateMessage = function (fromUser, toUser, message) {
                if (fromUser.connectionId != self.myConnectionId()) {
                    self.openPrivateChatRoom(fromUser);
                }
                self.activeChatRoom().messages.push(new MessageDetail(self, fromUser.userName, message));
            };
        };
    }

    var chatHub = $.connection.chatHub;
    var cm = new chatHubViewModel();
    cm.registerClientMethods();
    ko.applyBindings(cm);
    $.connection.hub.start();
});