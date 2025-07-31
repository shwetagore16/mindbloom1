// New Bloombox Chat JS for new-chat-widget
// New Bloombox Chat JS for new-chat-widget
const BLOOMBOX_WELCOME = "Hi! I'm Bloombox, your friendly AI. How can I help you today?";

function addNewChatMessage(text, sender) {
    const chatMessages = document.getElementById('new-chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'new-chat-msg user' : 'new-chat-msg ai';
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function aiResponse(userMsg) {
    addNewChatMessage('...', 'ai');
    try {
        const response = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer RZMbdYZKghLPCX75Fk4JPbYE3P0ue2j0COtIO69Q'
            },
            body: JSON.stringify({
                model: 'command-r-plus',
                message: userMsg
            })
        });
        const data = await response.json();
        const reply = data.text || data.reply || "Sorry, I couldn't process that.";
        return reply;
    } catch (err) {
        return "Sorry, I'm having trouble connecting to AI right now.";
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const chatWidget = document.getElementById('new-chat-widget');
    const toggleBtn = document.getElementById('bloombox-toggle-btn');
    const closeBtn = document.getElementById('bloombox-close-btn');
    const form = document.getElementById('new-chat-form');
    const input = document.getElementById('new-chat-input');

    if (!chatWidget || !toggleBtn || !closeBtn || !form) return;

    const openChat = () => {
        chatWidget.classList.add('show');
        toggleBtn.classList.remove('show');
    };

    const closeChat = () => {
        chatWidget.classList.remove('show');
        toggleBtn.classList.add('show');
    };


    closeBtn.addEventListener('click', closeChat);

    // Initial pop-up logic, once per session
    if (!sessionStorage.getItem('bloomboxPoppedUp')) {
        setTimeout(() => {
            addNewChatMessage(BLOOMBOX_WELCOME, 'ai');
            openChat();
            setTimeout(() => {
                closeChat();
                sessionStorage.setItem('bloomboxPoppedUp', 'true');
            }, 4000); // Auto-close after 4 seconds
        }, 1500); // Show after 1.5 seconds
    } else {
        toggleBtn.classList.add('show');
        addNewChatMessage(BLOOMBOX_WELCOME, 'ai');
    }

    function makeDraggable(element) {
        let isDragging = false;
        let wasDragged = false;
        let offsetX, offsetY;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            wasDragged = false;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            element.style.transition = 'none'; // Disable transition during drag
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            wasDragged = true;
            e.preventDefault();

            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            const boundary = 10;
            const maxX = window.innerWidth - element.offsetWidth - boundary;
            const maxY = window.innerHeight - element.offsetHeight - boundary;

            newX = Math.max(boundary, Math.min(newX, maxX));
            newY = Math.max(boundary, Math.min(newY, maxY));

            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                // This timeout prevents the click event from firing immediately after a drag
                setTimeout(() => { wasDragged = false; }, 0);
            }
        });

        element.addEventListener('click', (e) => {
            if (wasDragged) {
                e.stopPropagation();
                return;
            }
            openChat();
        });
    }

    makeDraggable(toggleBtn);

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const userMsg = input.value.trim();
        if (!userMsg) return;
        addNewChatMessage(userMsg, 'user');
        aiResponse(userMsg).then(reply => {
            const chatMessages = document.getElementById('new-chat-messages');
            const lastMsg = chatMessages.lastChild;
            if (lastMsg && lastMsg.classList.contains('ai') && lastMsg.textContent === '...') {
                chatMessages.removeChild(lastMsg);
            }
            addNewChatMessage(reply, 'ai');
        });
        input.value = '';
    });
});
