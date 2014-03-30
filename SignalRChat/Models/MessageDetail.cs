using Newtonsoft.Json;

namespace SignalRChat.Models
{
    public class MessageDetail
    {
        [JsonProperty("userName")]
        public string UserName { get; set; }
        [JsonProperty("message")]
        public string Message { get; set; }
    }
}