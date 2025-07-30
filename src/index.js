
import "@logseq/libs"

const timestampIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
<circle cx="12" cy="12" r="10"></circle>
<polyline points="12 6 12 12 16 14"></polyline>
</svg>`

const ourstyle = `
.audio-snippet-inline {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      color: var(--ls-link-text-color);
      text-decoration: none;
    }
    .audio-snippet-inline svg {
      vertical-align: middle;
      stroke: var(--ls-link-text-color);
    }
`

function main() {

  logseq.provideStyle( ourstyle )

  const root = document.querySelector( "#app" )
  const audio = document.createElement( "audio" )
  root.append( audio )

  /**
   * Check if we are playing or not
   * @returns { Boolean }
   */
  function isaudioplaying() {
  return (
    audio &&
    !audio.paused &&
    !audio.ended &&
    audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  );
}

  /**
   * Work through the dom to find an audio element
   * @param { * } thisdiv 
   * @returns 
   */
  function findaudio( thisdiv ) {
    const block = thisdiv.closest( 'div[haschild]' )

    if( block ) {
      const audio = block.querySelector( "audio" )
      if ( audio ) return audio
    }

    const parentblock = block.parentElement.closest( 'div[haschild]' )
    if( parentblock ) return parentblock.querySelector( "audio" )

    const cards = thisdiv.closest( '#cards-modal' )
    if( cards ) return cards.querySelector( "audio" )
  }

  /**
   * 
   * @param { string } markdown 
   * @returns { Array }
   */
  function iscontentaref( markdown ) {
    const refRegex = /\(\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)\)/gi;
    const matches = []
    let match

    while ((match = refRegex.exec(markdown)) !== null) {
      matches.push(match[1]) // push only the UUID part
    }

    return matches // returns an array of UUID strings
  }


  /**
   * 
   * @param { object } block 
   * @returns { Promise{ BlockEntity | null } }
   */
  async function resolveblockref( block ) {
    const refs = iscontentaref( block?.content )
    if( 0 === refs.length ) return block

    const referencedblock = await logseq.Editor.getBlock( refs[ 0 ] )
    return referencedblock

  }

  /**
   * Match markdown image or media link syntax: ![alt](../assets/filename)
   * @param { string } markdown 
   * @returns { string } the audio path
   */
  function extractaudioasset( markdown ) {
    const mediaRegex = /!?\[.*?\]\((.*?)\)/
    const match = markdown.match(mediaRegex)

    return match ? match[1] : null // Just the path inside (...)
  }


    /**
   * Work through our blocks to find an audio element
   * @param { * } thisdiv 
   * @returns { Promise< string > }
   */
  async function findaudiourl( thisuuid ) {

    const block = await logseq.Editor.getBlock( thisuuid )

    const parent = await logseq.Editor.getBlock( block.parent.id )

    for( const child of parent.children ) {
      if( "uuid" !== child[ 0 ] ) continue
      const uuid = child[ 1 ]

      let childblock = await logseq.Editor.getBlock( uuid )
      childblock = await resolveblockref( childblock )

      const audiourl = extractaudioasset( childblock?.content)
      if( audiourl ) return audiourl
    }
  }

  /**
   * Insert the renderer text at the current cursor
   * @param { number } start 
   * @param { number } stop 
   * @returns { Promise }
   */
  async function instertrenderertext( start, stop ) {

    if( stop ) {
      await logseq.Editor.insertAtEditingCursor( `{{renderer audio-snippet ${start} ${stop}}}` )
      return
    }
    await logseq.Editor.insertAtEditingCursor( `{{renderer audio-snippet ${start}}}` )
  }

  /**
   * First slash command
   */
  logseq.Editor.registerSlashCommand( "Audio Snippet", async (e) => {
    await instertrenderertext( 0 )
  } )

  /**
   * Second slash command
   */
  logseq.Editor.registerSlashCommand( "Audio Snippet with stop", async (e) => {
    await instertrenderertext( 0, 5 )
  } )

  let playingurl, playingstart, playingstop

  logseq.provideModel( {
    /**
     * repspond to our onclick
     * @param { object } e 
     * @returns { Promise }
     */
    async playsnippet( e ) {

      const { start, stop, blockUuid } = e.dataset

      const audiourl = await findaudiourl( blockUuid )
      if( !audiourl ) return

      if( isaudioplaying() &&
          audiourl === playingurl &&
          playingstart === start &&
          playingstop === stop ) {
        audio.pause()
        return
      }

      playingurl = audiourl
      playingstart = start
      playingstop = stop

      const graphinfo = await logseq.App.getCurrentGraph()
      const graphpath = graphinfo?.path

      const fullpath = "file://" + graphpath + "/assets/" + audiourl

      audio.src = fullpath
      audio.play()
      audio.currentTime = parseFloat( start )

      if (!stop) return
      const stopTime = parseFloat(stop)

      const stopHandler = () => {
        if (audio.currentTime >= stopTime) {
          audio.pause()
          audio.removeEventListener("timeupdate", stopHandler)
        }
      }

      audio.addEventListener("timeupdate", stopHandler) 
    }
  } )

  /**
   * Render
   */
  let keyindex = 0
  logseq.App.onMacroRendererSlotted( ( args ) => {

    const { slot, payload } = args
    const rendererarg = payload.arguments

    const thisindex = keyindex++
    const key = `audioSnippet${thisindex}`

    const [ name, start, stop ] = rendererarg[ 0 ].split( " " )
    if( "audio-snippet" !== name ) return

    let range = `${start}s–${stop}s`
    if( !stop ) {
      range = `${start}`
    }

    const template = 
      `<span class="audio-snippet-inline" title="Play snippet">
        ${timestampIcon} 
        <span id="${key}" 
          data-on-click="playsnippet" 
          data-start="${start}" 
          data-stop="${stop}"
          data-block-uuid="${payload.uuid}"
          >${range}</span>
       </span>
      `

    logseq.provideUI( {
      key,
      slot,
      template,
      placement: "inline",
      reset: true
    } )
  } )
}

logseq.ready( main ).catch( console.error )

