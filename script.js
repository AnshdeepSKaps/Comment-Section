
const commentBoxTemplate = document.querySelector("[comment-box-template]")
const commentTemplate = document.querySelector("[comment-template]")
const phantomReplyTemplate = document.querySelector("[phantom-reply-template]")
const addCommentTemplate = document.querySelector("[add-comment-template]")
const container = document.getElementsByClassName("container")

const commentObject = {
    "id": 1,
      "content": "",
      "createdAt": "",
      "score": 0,
      "user": {
        "image": { 
          "png": "./images/avatars/image-amyrobson.png",
          "webp": "./images/avatars/image-amyrobson.webp"
        },
        "username": ""
      },
      "replies": []
}

let id = 1
let comments = []

async function fetchData(){

    const response = await fetch('data.json')
    const json = await response.json()
        .then(data => {
            
            currentUser = data.currentUser
            
            comments = data.comments.map(element => {
                let commentBox = commentBoxTemplate.content.cloneNode(true).children[0]
                let replies = element.replies
                delete element.replies
                return {"id": id++, "commentBox": commentBox, "comment": element, "replies": replies};
            })
            
            sortComments()

            comments.forEach(commentObject => {
                let comment = makeCommentCard(commentObject.comment, commentObject.commentBox)
                
                if(commentObject.comment.user.username == currentUser.username){

                    deleteButton = comment.children[1].children[0].children[4]
                    editButton = comment.children[1].children[0].children[5]
                    deleteButton.addEventListener('click', () => {
                        window.alert(comment, commentObject.commentBox)
                    })
                
                    editButton.addEventListener('click', () => {
                        handleEdit(comment, commentObject.commentBox)
                    })
                }
                else{
                    replyButton = comment.children[1].children[0].children[3]
                    replyButton.addEventListener('click', () => {
                        removeAllPhantomComments()           
                        let phantomReplyBox = createPhantomComment(commentObject.commentBox)
                        insertAfter(commentObject.commentBox.children[0], phantomReplyBox)
                    })
                }

                let replySection = commentObject.commentBox.children[1].children[1]

                let replies = commentObject.replies
                replies.forEach(replyObject => {
                    
                    let replyCard = makeReplyCard(replyObject)
                    replySection.append(replyCard)

                    if(replyObject.user.username == currentUser.username){

                        deleteButton = replyCard.children[1].children[0].children[4]
                        editButton = replyCard.children[1].children[0].children[5]
                        deleteButton.addEventListener('click', () => {
                            window.alert(replyCard, commentObject.commentBox)
                        })
                    
                        editButton.addEventListener('click', () => {
                            handleEdit(replyCard, commentObject.commentBox)
                        })
                    }
                    else{
                        replyButton = replyCard.children[1].children[0].children[3]
                        replyButton.addEventListener('click', () => {
                            removeAllPhantomComments()           
                            let phantomReplyBox = createPhantomComment(replyCard.parentNode)
                            insertAfter(replyCard, phantomReplyBox)
                        })
                    }
                })

                container[0].append(commentObject.commentBox)
            })
            
            addCommentBox()
            adjustBodyHeight()
            let alert = document.getElementsByClassName("alert-screen")[0]
            localStorage.setItem("comments", JSON.stringify(comments))
            
            // -------------------------- Media Query --------------------------
            
            changeStructure()
            const mediaQuery = window.matchMedia('(max-width: 1100px)')
            
            if(mediaQuery.matches){
                container[0].style.width = "90%"
                Array.from(container[0].children).forEach(element => {
                    element.remove()
                })
            
                comments.forEach(commentObject => {
                    // console.log(commentObject.newCommentBox)
                    container[0].append(commentObject.newCommentBox)
                })
            }
        })
}

fetchData()

function makeCommentCard(element, commentBox){
    
    let comment = commentBox.children[0];
    
    let counter = comment.children[0];
    counter.children[1].innerHTML = element.score;

    let content = comment.children[1];

    let header = content.children[0];
    
    header.children[0].src = element.user.image.png
    header.children[1].innerHTML = element.user.username
    header.children[2].innerHTML = element.createdAt
    
    let text = content.children[1]
    text.innerHTML = element.content

    if(element.user.username == currentUser.username){
        addElements(header)
    }
    return comment
}

function sortComments(){
    comments.sort((a,b) => {
        return b.comment.score - a.comment.score 
    })
}

function makeReplyCard(reply){  
    let replyCard = commentTemplate.content.cloneNode(true).children[0]
    replyCard.style.width = "40vw"
    replyCard.style.marginLeft = "auto"
    replyCard.classList.add("reply-card")

    let counter = replyCard.children[0];
    counter.children[1].innerHTML = reply.score;

    let content = replyCard.children[1];

    let header = content.children[0];
    
    header.children[0].src = reply.user.image.png
    header.children[1].innerHTML = reply.user.username
    header.children[2].innerHTML = reply.createdAt
    let name = header.children[1]
    let text = content.children[1]
    text.innerHTML = reply.content

    let replyingTo = reply.replyingTo
    text.setAttribute('data-before', `@${replyingTo} `)
    
    if(reply.user.username == currentUser.username){
        addElements(header)
    }
    else{       
        tempHeader = header.cloneNode(true) //trick to get widths before appending element 
        container[0].append(tempHeader)
        let tempWidth =  tempHeader.children[1].offsetWidth
        tempHeader.remove()
        header.style.gridTemplateColumns = `50px ${tempWidth + 10}px 100px 1fr`
    }
 
    return replyCard 
}

function sortReplies(replies){  // input array of replies, returns sorted array
    
    comparison = {"day":1, "week":2, "month":3} 

    replies.sort((a,b) => {
        let aMeasure = a.reply.createdAt.substring(2, a.reply.createdAt.indexOf(" ", 2))
        let bMeasure = b.reply.createdAt.substring(2, b.reply.createdAt.indexOf(" ", 2))
        let aTime = parseInt(a.reply.createdAt.substring(0, 2))
        let bTime = parseInt(b.reply.createdAt.substring(0, 2))
        
        if(aMeasure.slice(-1) == 's'){
            aMeasure = aMeasure.substring(0, aMeasure.length-1)
        }
        
        if(bMeasure.slice(-1) == 's'){
            bMeasure = bMeasure.substring(0, bMeasure.length-1)
        }
        
        if(aMeasure != bMeasure){
            return comparison[aMeasure] - comparison[bMeasure]
        }
        else{
            return aTime - bTime
        }
    })

    let temp = replies.map(reply => reply)
    return temp
}



window.alert = function alert(replyCard, commentBox){
    let alert = document.getElementsByClassName("alert-screen")[0]
    alert.classList.remove("inactive")
    disableScroll()

    let alertCancel = document.getElementsByClassName("alert-cancel-btn")[0]
    let alertDelete = document.getElementsByClassName("alert-delete-btn")[0]

    newCancel = alertCancel.cloneNode(true)
    newDelete = alertDelete.cloneNode(true)
    
    alertCancel.replaceWith(newCancel)
    alertDelete.replaceWith(newDelete)
    
    newCancel.addEventListener('click', () => {handleCancel(replyCard)})
    newDelete.addEventListener('click', () => {handleDelete(replyCard); localStorage.setItem("comments", JSON.stringify(comments))})
}

function handleDelete(replyCard){
    let alert = document.getElementsByClassName("alert-screen")[0]
    alert.classList.add("inactive")
    enableScroll(); 
    if(replyCard.parentNode.classList[0] == "comment-box"){   //remove entire comment from the array
        deleteFromArray(replyCard.parentNode)
        replyCard.parentNode.remove()
    }
    else{                                                       //remove only the reply from the comment object inside the array        

        let trackedCommentBox = replyCard.parentNode.parentNode.parentNode
        let commentIndex = comments.findIndex(element => element.commentBox == trackedCommentBox)
        let replyIndex = comments[commentIndex].replies.findIndex(reply => reply.content == replyCard.children[1].children[1].textContent)
        comments[commentIndex].replies.splice(replyIndex, 1)
        replyCard.remove()
    }
    adjustBodyHeight(-1)
} 

function deleteFromArray(commentBox){
    commentIndex = comments.findIndex(element => element.commentBox == commentBox)
    comments.splice(commentIndex, 1)
}

function handleCancel(){
    let alert = document.getElementsByClassName("alert-screen")[0]
    alert.classList.add("inactive")
    enableScroll(); 
}

function createPhantomComment(currentCommentBox){

    let phantomReplyBox = phantomReplyTemplate.content.cloneNode(true).children[0]
    phantomReplyBox.style.width = "40vw"
    phantomReplyBox.style.marginLeft = "auto"  
    let phantomReplyButton = phantomReplyBox.children[2].children[0]          
    let phantomCancelButton = phantomReplyBox.children[2].children[1]
    phantomReplyButton.addEventListener('click', () => pasteReply(currentCommentBox, phantomReplyBox))
    phantomCancelButton.addEventListener('click', () => phantomReplyBox.remove())
    return phantomReplyBox
}

function pasteReply(currentCommentBox, phantomReplyBox){
    
    let replacementComment = commentTemplate.content.cloneNode(true).children[0]
    replacementComment.style.width = "40vw"
    replacementComment.style.marginLeft = "auto"
    replacementComment.classList.add("reply-card")
    
    let counter = replacementComment.children[0]
    let mainContent = replacementComment.children[1]
    let header = mainContent.children[0]
    let textContent = mainContent.children[1]
    
    counter.children[1].textContent = "0"
    header.children[0].src = currentUser.image.png
    header.children[1].textContent = currentUser.username
    header.children[2].textContent = "Just Now"
    textContent.textContent = phantomReplyBox.children[1].value 
    
    let replyingTo = currentCommentBox.children[0].children[1].children[0].children[1].textContent
    textContent.setAttribute('data-before', `@${replyingTo} `)

    var replySection
    console.log(currentCommentBox)
    if(currentCommentBox.classList[0] == "comment-box"){
        replySection = currentCommentBox.children[2].children[1]    // children[2] because the phantom becomes a child temporarily
        pushReplyToArray(replacementComment, currentCommentBox)
    }
    else{
        replySection = currentCommentBox
        let trackedCommentBox = replySection.parentNode.parentNode
        pushReplyToArray(replacementComment, trackedCommentBox)
    }
    
    phantomReplyBox.remove()
    replySection.append(replacementComment)
    
    adjustBodyHeight()

    addElements(header, replacementComment)

    header.children[4].addEventListener('click', () => {
        let currentCommentBox = header.children[4].parentNode.parentNode.parentNode
        window.alert(replacementComment, currentCommentBox)
    })

    header.children[5].addEventListener('click', () => {
        let currentCommentBox = header.children[5].parentNode.parentNode.parentNode.parentNode
        handleEdit(replacementComment, currentCommentBox)
    })

    localStorage.setItem("comments", JSON.stringify(comments))
}

function pushReplyToArray(replyCard, commentBox) {
    replyObject = makeReplyObject(replyCard)
    let replyingToName = commentBox.children[0].children[1].children[0].children[1].textContent
    replyObject.replyingTo = replyingToName
    index = comments.findIndex(element => element.commentBox == commentBox)
    comments[index].replies.push(replyObject)
}

function makeReplyObject(replyCard){

    return obj = {
        "id": 1,
        "content": `${replyCard.children[1].children[1].textContent}`,
        "createdAt": `Just Now`,
        "score": 0,
        "replyingTo": "",
        "user": {
            "image": { 
            "png": `${replyCard.children[1].children[0].children[0].src}`,
            "webp": "./images/avatars/image-amyrobson.webp"
            },
            "username": `${replyCard.children[1].children[0].children[1].textContent}`
        }
    }
}

function removeAllPhantomComments(){
    let phantomComments = document.getElementsByClassName("phantom-reply")
    Array.from(phantomComments).forEach(element => {
        element.remove()
    })
}

function handleEdit(replyCard, commentBox){

    let phantomComment = createPhantomComment(commentBox)
    phantomComment = editPhantomComment(phantomComment)

    updateButton = phantomComment.children[2].children[0]
    cancelButton = phantomComment.children[2].children[1]

    if(commentBox.classList[0] == "comment-box"){
        phantomComment.children[1].textContent = commentBox.children[0].children[1].children[1].textContent
    }
    else{
        phantomComment.children[1].textContent = replyCard.children[1].children[1].textContent
    }

    replyCard.replaceWith(phantomComment)
    
    updateButton.addEventListener('click', () => {

        if(commentBox.classList[0] == "comment-box"){   // editing a comment

            let editedText = phantomComment.children[1].value
            commentIndex = comments.findIndex(element => element.commentBox == commentBox)
            comments[commentIndex].comment.content = editedText
            replyCard.children[1].children[1].textContent = editedText
            phantomComment.replaceWith(replyCard)
        }
        else{   // editing a reply
            
            let editedText = phantomComment.children[1].value
            trackedCommentBox = commentBox.parentNode.parentNode
            commentIndex = comments.findIndex(element => element.commentBox == trackedCommentBox)
            replyIndex = comments[commentIndex].replies.findIndex(reply => reply.content == replyCard.children[1].children[1].textContent)
            replyCard.children[1].children[1].textContent = editedText
            comments[commentIndex].replies[replyIndex].content = editedText
            phantomComment.replaceWith(replyCard)
        }
    })

    cancelButton.addEventListener('click', () => {
        phantomComment.replaceWith(replyCard)
    })
}

function editPhantomComment(phantomComment){
    buttonContainer = phantomComment.children[2]

    let updateButton = document.createElement("div")
    updateButton.classList.add('phantom-reply-btn')
    updateButton.textContent = "Update"

    let cancelButton = document.createElement("div")
    cancelButton.classList.add('phantom-cancel-btn')
    cancelButton.textContent = "Cancel"

    buttonContainer.children[0].replaceWith(updateButton)
    buttonContainer.children[1].replaceWith(cancelButton)

    return phantomComment
}

function addCommentBox(){
    let addCommentBox = addCommentTemplate.content.cloneNode(true).children[0]
    let sendButton = addCommentBox.children[2]

    container[0].append(addCommentBox)
    
    sendButton.addEventListener('click', () => {
        let replacementCommentBox = commentBoxTemplate.content.cloneNode(true).children[0]          //This is entirely from pasteReply() except one line
        let inputText = addCommentBox.children[1].value

        let replacementComment = commentTemplate.content.cloneNode(true).children[0]
        replacementCommentBox.children[0].replaceWith(replacementComment)

        let counter = replacementComment.children[0]
        let mainContent = replacementComment.children[1]
        let header = mainContent.children[0]
        let textContent = mainContent.children[1]
        
        counter.children[1].textContent = "0"
        header.children[0].src = currentUser.image.png
        header.children[1].textContent = currentUser.username
        header.children[2].textContent = "Just Now"
        textContent.textContent = addCommentBox.children[1].value
        addCommentBox.children[1].value = ""
        container[0].append(replacementCommentBox) 

        addElements(header, replacementComment)
        deleteButton = header.children[4]
        editButton = header.children[5]

        commentObj = makeCommentObject(replacementCommentBox)
        pushCommentToArray(commentObj)

        adjustBodyHeight()

        deleteButton.addEventListener('click', () => {
            window.alert(replacementComment, replacementComment)
        })

        editButton.addEventListener('click', () => {
            handleEdit(replacementComment, replacementCommentBox)
        })        
    })
}

function makeCommentObject(commentBox){
    commentId = id++
    comment = commentBox.children[0]
    commentElement = {
        "id": 1,
        "content": `${comment.children[1].children[1].textContent}`,
        "createdAt": `${comment.children[1].children[0].children[3].textContent}`,
        "score": 0,
        "user": {
            "image": { 
                "png": `${comment.children[0].children[1].src}`,
                "webp": "./images/avatars/image-amyrobson.webp"
            },
        "username": `${comment.children[0].children[1].textContent}`
      },
        "replies": []
    }
    return {id : commentId, commentBox: commentBox, comment: commentElement, replies: []} 
}

function pushCommentToArray(commentObj){
    comments.push(commentObj)
}

function addElements(commentBoxHeader){
    header = commentBoxHeader
    let newYouElement = document.createElement("div")
    newYouElement.innerHTML = "you"
    newYouElement.style.width = "fit-content"
    newYouElement.style.padding = "4px 4px"
    newYouElement.style.backgroundColor = "hsl(238, 40%, 52%)"
    newYouElement.style.color = "white"
    newYouElement.style.borderRadius = "5px"
    newYouElement.style.fontWeight = "500"
    newYouElement.style.fontSize = ".8rem"
    insertAfter(header.children[1], newYouElement)

    let newDelElement = document.createElement("div")
    newDelElement.classList.add("del-button")
    newDelElement.style.alignItems = "center"
    newDelElement.style.justifySelf = "end"
    newDelElement.style.width = "65px"
    newDelElement.style.display = "grid"
    newDelElement.style.gridTemplateColumns = "1fr 1fr"
    let delText = document.createElement("div")
    let delIcon = document.createElement("img")
    newDelElement.appendChild(delIcon)
    newDelElement.appendChild(delText)
    delText.textContent = "Delete"
    delText.style.color = "hsl(358, 79%, 66%)"
    delText.style.fontWeight = "600"
    delIcon.src = "images/icon-delete.svg"
    insertAfter(header.children[3], newDelElement)

    let newEditElement = header.children[5].cloneNode(true)
    newEditElement.classList.remove("reply")
    newEditElement.classList.add("edit")
    newEditElement.children[0].classList.remove("reply-icon")
    newEditElement.children[0].classList.add("edit-icon")
    newEditElement.children[0].src = "images/icon-edit.svg"
    newEditElement.children[1].classList.remove("reply-text")
    newEditElement.children[1].classList.add("edit-text")
    newEditElement.children[1].textContent = "Edit"
    header.replaceChild(newEditElement, header.children[5])

    tempHeader = header.cloneNode(true) //trick to get widths before appending element 
    container[0].append(tempHeader)
    let tempWidth =  tempHeader.children[1].offsetWidth
    tempHeader.remove()

    header.style.gridTemplateColumns = `50px calc(${tempWidth}px + 8px) .5fr 86px 1fr 1fr`;    
}
    
function insertAfter(referenceNode, newNode)
{
    referenceNode.parentNode.insertBefore( newNode, referenceNode.nextSibling);
}

function adjustBodyHeight(n = 1){
    let body = document.getElementsByTagName("body")[0]
    if(n==1)
    body.style.height = body.offsetHeight + n*(120 + 50) + 'px'
    else
    body.style.height = body.offsetHeight + n*(136 - 70) + 'px'

    let alertScreen = document.getElementsByClassName("alert-screen")[0]
    alertScreen.style.height = body.style.height
}

function disableScroll() {
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
  
    window.onscroll = function() {
        window.scrollTo(scrollLeft, scrollTop);
    };
}
  
function enableScroll() {
    window.onscroll = function() {};
}


// ------------------------ Media Query ------------------------

function changeStructure(){

    comments = comments.map((commentObject) => {
        
        let newCommentBox = commentObject.commentBox.cloneNode(true)
        newCommentBox.classList.add("new-comment-box")
        let newCommentHeader = newCommentBox.children[0].children[1].children[0]
        let newCommentCard = changeCardStructure(newCommentBox.children[0], newCommentHeader)
        // console.log(newCommentCard)
        newCommentBox.children[0] = newCommentCard
        
        let newReplySection = newCommentBox.children[1].children[1]
        Array.from(newReplySection.children).forEach(replyCard => {
            replyCard.remove()
        })

        let replySection = commentObject.commentBox.children[1].children[1]
        if(replySection.children[0] != null){
            Array.from(replySection.children).forEach(replyCard => {
                let newReplyCard = replyCard.cloneNode(true)
                let newReplyHeader = newReplyCard.children[1].children[0]
                newReplyCard = changeCardStructure(newReplyCard, newReplyHeader)
                console.log(newReplyCard)
                newReplySection.append(newReplyCard)
            })
        }

        newCommentBox.children[1].children[1] = newReplySection
        let newReplyBox = newCommentBox.children[1]
        newReplyBox.style.gridTemplateColumns = "0.1fr 1fr"
        commentObject["newCommentBox"] = newCommentBox
        return commentObject
    })
}

function changeCardStructure(card, header){
    
    // let newCard = card.cloneNode(true)
    let counter = card.children[0]
    
    // console.log(card)
    
    card.style.display = "grid"
    card.style.gridTemplateRows = "1fr .1fr"
    card.style.gridTemplateColumns = "none"
    card.style.width = "100%"
    card.style.paddingLeft = "15px"
    card.style.paddingRight = "15px"
    
    counter.children[0].style.top = "36%"
    counter.children[0].style.left = "10%"
    counter.children[1].style.top = "30%"
    counter.children[2].style.bottom = "44%"
    counter.children[2].style.right = "10%"
    // counter.children[2].style.left = "none"
    counter.style.height = "5vh"
    
    let footer = document.createElement("div")
    footer.style.height = "fit-content"
    footer.style.alignItems = "center"
    footer.style.justifyContent = "center"
    
    footer.classList.add("footer")
    footer.append(counter)

    if(header.children[1].textContent == currentUser.username){
          
        let deleteButton = header.children[4]
        let editButton = header.children[5]
        footer.append(deleteButton)
        footer.append(editButton)
        header.style.gridTemplateColumns = "49px 80px 30px 1fr"
        footer.style.gridTemplateColumns = "1fr 1fr 1fr"
    }
    else{
        
        let replyButton = header.children[3]
        replyButton.style.height = "5vh";
        replyButton.justifySelf = "center"
        header.style.gridTemplateColumns = "49px 1fr 1fr"
        footer.style.gridTemplateColumns = ".4fr 1fr"
        footer.append(replyButton)
    }
    card.children[0].children[0].children[2].style.textAlign = "right"

    card.append(footer)
    return card
}
    


