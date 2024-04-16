# Nunu Bot
Nunu is a smart voice over bot.
Whenever someone joins a voice call, Nunu would also like to join.

When the person that joined the call starts to talk, Nunu will play a pre-recorded audio sound. Once finalized, Nunu would like to leave the voice call.

Whenever someone else joins the call, Nunu would repeat the process.

> **Nunu is completely clustered**
Meaning that it shares load distribution across multiple child processes.

**SEE IN ACTION**<br>
<a href="https://www.youtube.com/watch?v=0H-ireCbZEo&feature=youtu.be">Teaser</a>

#### Installation
Requires libsodium being installed on your machine before performing any installation command(s).

``npm install``

#### Configuration
After configuring ``config.yaml`` you can start using nunu.
> Run ``/dist/index.js``
