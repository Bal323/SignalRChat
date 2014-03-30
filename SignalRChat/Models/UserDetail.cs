using Newtonsoft.Json;

namespace SignalRChat.Models
{
    public class UserDetail
    {
        [JsonProperty("connectionId")]
        public string ConnectionId { get; set; }
        [JsonProperty("userName")]
        public string UserName { get; set; }
    }
}