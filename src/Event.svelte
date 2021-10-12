<script>
    export let title = "Title";
    export let where = "Where?";
    export let when = "When?";
    export let img = {
            src: "",
            alt: "Alternative text"
    };
</script>

<div class="container">
    <h1>{title}</h1>
    <div class="info-box">
        <div class="label">
            <p>Hvor?</p>
            <p>Når?</p>
        </div>
        <div class="info">
            <p>{where}</p>
            <p>{when}</p>
        </div>

    </div>
    <div class="crop">
        <img src={img.src} alt={img.alt}>
    </div>
    <button>CTA!</button>
</div>

<style>

    :root {
        --main-border-color: rgb(39, 196, 18);
        --main-yellow: rgb(255, 253, 118);
    }

    h1 {
        margin-bottom: 2px;
        text-align: center;
        font-size: 3rem;
        
    }

    .container button {
        margin-top: 10px;
        padding: 5px;
        width: 20%;
        align-self: center;
        border: 2px solid black;
        box-shadow: 2px 2px 5px grey;
        background-color: var(--main-yellow);
    }

    .container {
        display: flex;
        flex-direction: column;
        align-content: flex-end;
        max-width: 600px;
        padding: 20px;
        margin: 10px 0px 10px 0px;
        background-color: rgb(193, 243, 178);
        border-top: 3px solid var(--main-border-color);
        border-right: 6px solid var(--main-border-color);
        border-left: 1px solid rgb(180, 180, 180);
        border-bottom: 1px solid rgb(180, 180, 180);
    }

    .info-box {
        display: flex;
        justify-content: flex-start;
        padding: 10px;
        font-weight: bold;
        border-top: 3px solid var(--main-border-color);
        background-image: linear-gradient(to right, rgba(246, 250, 6, 0), var(--main-yellow));
    }

    .info-box p {
        padding: 2px;
        margin: 5px 10px 5px 10px;
    }

    .label p {
        padding: 2px 4px 2px 4px;
        color:var(--main-yellow);
        background-color: var(--main-border-color);
        box-shadow: 2px 2px 5px rgb(160, 156, 156);
    }

    .crop {
        display: flex;
        align-items: center;
        justify-items: center;
        width: 600px;
        height: 200px;
        overflow: hidden;
    }

    .crop img {

        min-height: 100%;
        min-width: 100%;
    }




</style>