using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using SignalRChat.Models;

namespace SignalRChat.Hubs
{
    public class ChatHub : Hub
    {
        #region Data Members

        static List<UserDetail> ConnectedUsers = new List<UserDetail>();
        static List<MessageDetail> CurrentMessage = new List<MessageDetail>();

        #endregion

        #region Methods
        public override Task OnConnected()
        {
            var id = Context.ConnectionId;


            if (ConnectedUsers.Count(x => x.ConnectionId == Context.ConnectionId) == 0)
            {
                ConnectedUsers.Add(new UserDetail { ConnectionId = id, UserName = Context.User.Identity.Name });

                // send to caller
                Clients.Caller.onConnected(id, Context.User.Identity.Name, ConnectedUsers, CurrentMessage);

                // send to all except caller client
                Clients.AllExcept(id).onNewUserConnected(id, Context.User.Identity.Name);

            }
            return base.OnConnected();
        }

        public void SendMessageToAll(string message)
        {
            // store last 100 messages in cache
            AddMessageinCache(Context.User.Identity.Name, message);

            // Broad cast message
            Clients.All.messageReceived(Context.User.Identity.Name, message);
        }

        public void SendPrivateMessage(string toUserId, string message)
        {

            string fromUserId = Context.ConnectionId;

            var toUser = ConnectedUsers.FirstOrDefault(x => x.ConnectionId == toUserId) ;
            var fromUser = ConnectedUsers.FirstOrDefault(x => x.ConnectionId == fromUserId);

            if (toUser != null && fromUser!=null)
            {
                // send to 
                Clients.Client(toUserId).sendPrivateMessage(fromUser, toUser, message); 

                // send to caller user
                Clients.Caller.sendPrivateMessage(fromUser, toUser, message); 
            }

        }

        public override System.Threading.Tasks.Task OnDisconnected()
        {
            var item = ConnectedUsers.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);
            if (item != null)
            {
                ConnectedUsers.Remove(item);

                var id = Context.ConnectionId;
                Clients.All.onUserDisconnected(id, item.UserName);

            }

            return base.OnDisconnected();
        }

        #endregion

        #region private Messages

        private void AddMessageinCache(string userName, string message)
        {
            CurrentMessage.Add(new MessageDetail { UserName = userName, Message = message });

            if (CurrentMessage.Count > 100)
                CurrentMessage.RemoveAt(0);
        }

        #endregion
    }
}