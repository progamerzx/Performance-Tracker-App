pipeline{
    agent any
    environment{
        IMAGE_NAME= "ctslab/pta"
        IMAGE_TAG= "${BUILD_ID}"
    }

    stages{
        stage('Checkout'){
            steps{
                checkout scm
            }
        }
        stage('Build'){
            steps{
                bat "npm ci"
                bat "npm run lint"
                bat "npm run build"
            }
        }

        stage('Build Docker Image'){
            steps{
                bat "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
            }
        }
        stage('Verify the image'){
            steps{
                bat "docker image inspect ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage("Login to Docker Registry"){
            steps{
                withCredentials([
                    usernamePassword(
                        credentialId: "dockerhub-creds",
                        usernameVariable: "DOCKER_USER",
                        passwordVariable: "DOCKER_PASS"
                    )
                ]){
                    bat "docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}"
                }
            }
        }

        stage("Push image to docker registry"){
            steps{
                bat "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage("Verify the registry"){
            steps{
                bat "docker pull ${IMAGE_NAME}:${IMAGE_TAG}"
                bat "docker logout"
            }
        }
        
    }

    post{
        success{
            echo "Pipeline executed sucessfully"
        }
        failure{
            echo " Pipeline failed"
        }
    }
}