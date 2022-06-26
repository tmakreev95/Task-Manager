import { Router } from '@angular/router';
import { AuthService } from './../../services/auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-sing-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
  }

  onSignUpButtonClicked(email: string, password: string, passwordRepeat: string) {
    if(password === passwordRepeat) {
      this.authService.signUp(email, password).subscribe((response: HttpResponse<any>) => {
        console.log(response);
        this.router.navigate(['/lists']);
      });
    } else {
      console.log("Passwords does not match!");
    }
  }

}
