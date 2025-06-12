const MODEL_NAME = process.env.OPENAI_AUDIO_MODEL;
const MODLE_VOICE = process.env.OPENAI_AUDIO_VOICE;
const client_secret = process.env.CLOVA_CLIENT_SECRET;


class ClovaTTS {

  constructor() {
    this.isProcessing = false;
    this.requestQueue = [];
    this.strBuffer = '';
  }

  async clovaTTS(text, socket, luckType) {
    console.log('clovaTTS called text:', text);
    const api_url = "https://api.openai.com/v1/audio/speech";
    const formData = new FormData();
    formData.append('model', MODEL_NAME);
    formData.append('input', text);
    formData.append('voice', MODLE_VOICE);
  
    try {
      const response = await fetch(api_url, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${client_secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL_NAME, // 또는 tts-1-hd
          input: text,
          voice: MODLE_VOICE,  // or alloy, echo, fable, onyx, shimmer
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const DELAYTIME = 100;
  
      let audioBuffer = [];
  
      const transmitData = async () => {
        if (audioBuffer.length > 0) {
          await socket.emit('audioChunk', Buffer.concat(audioBuffer));
          audioBuffer = [];
        }
      };
  
      const transmitInterval = setInterval(transmitData, DELAYTIME);
  
      // 스트림 처리
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          clearInterval(transmitInterval);
          transmitData();
          break;
        }
        audioBuffer.push(value);
      }
  
    } catch (error) {
      console.error('Error during TTS request:', error);
      throw error;
    }
  }
  
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
  
    this.isProcessing = true;
    const { text, socket, luckType } = this.requestQueue.shift();
  
    try {
      await this.clovaTTS(text, socket, luckType);
    } catch (error) {
      console.error('Error in processQueue:', error);
    } finally {
      this.isProcessing = false;
      process.nextTick(() => this.processQueue());  
    }
  }
  
  tts(str, socket, luckType) {
    this.strBuffer += str;
    if (this.strBuffer.includes('.')||this.strBuffer.includes('?')||this.strBuffer.includes('!')||this.strBuffer.includes(',')){
      const text = this.strBuffer
      this.requestQueue.push({ text, socket, luckType });
      this.processQueue();
      this.strBuffer = '';
    }
  }
  
  async processWaitPromise() {
    return new Promise((resolve, reject) => {
      const waitInterval = setInterval(() => {
        if (!this.isProcessing && this.requestQueue.length === 0) {
          clearInterval(waitInterval);
          resolve();
        }
      }, 100);
    });
  }
}



module.exports = ClovaTTS;