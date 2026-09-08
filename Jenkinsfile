pipeline {
  agent any

  tools {
    nodejs 'node-v22'
  }

  environment {
    // ENV_CLIENT_RASPA: debe contener VITE_DATA_URL=/api (no http://localhost...)
    // ENV_SERVER_RASPA: debe contener el .env del Server (DB, SMTP, MINIO, IMAP, PORT, etc.)
    ENV_CLIENT_RASPA = credentials('ENV_CLIENT_RASPA')
    ENV_SERVER_RASPA = credentials('ENV_SERVER_RASPA')
  }

  stages {

    stage('Copy .env files') {
      steps {
        script {
          def env_server = readFile(ENV_SERVER_RASPA)
          def env_client = readFile(ENV_CLIENT_RASPA)

          writeFile file: './Server/src/.env', text: env_server
          writeFile file: './Client/.env', text: env_client

          // Verificar
          sh 'ls -la ./Server/src/.env'
          sh 'ls -la ./Client/.env'
        }
      }
    }

    stage('build client') {
      steps {
        script {
          sh 'cd ./Client && npm install --legacy-peer-deps'
          sh 'cd ./Client && npm run build'
        }
      }
    }

    stage('down docker compose') {
      steps {
        script {
          sh 'docker compose down'
        }
      }
    }

    stage('delete images client') {
      steps {
        script {
          def image = 'web_raspas'
          if (sh(script: "docker images -q ${image}", returnStdout: true).trim()) {
            sh "docker rmi ${image}"
          } else {
            echo "Image ${image} does not exist."
          }
        }
      }
    }

    stage('delete images server') {
      steps {
        script {
          def image = 'raspas-server-1'
          if (sh(script: "docker images -q ${image}", returnStdout: true).trim()) {
            sh "docker rmi ${image}"
          } else {
            echo "Image ${image} does not exist."
          }
        }
      }
    }

    stage('run docker compose') {
      steps {
        script {
          // .env se carga en el Dockerfile del server; docker-compose lo lee
          sh 'docker compose up -d --build'
        }
      }
    }
  }
}